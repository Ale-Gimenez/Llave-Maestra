from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Count, Sum, Q, F
from decimal import Decimal

from .models import Condominio, Unidade, Cobranca, Acordo, ParcelaAcordo
from .serializers import (
    CondominioSerializer, UnidadeSerializer,
    CobrancaSerializer, AcordoSerializer, ParcelaAcordoSerializer
)
from .filters import CobrancaFilter, AcordoFilter, UnidadeFilter
from .permissions import IsAdminOrReadOnly


class CondominioViewSet(viewsets.ModelViewSet):
    queryset = Condominio.objects.all()
    serializer_class = CondominioSerializer
    permission_classes = [IsAdminOrReadOnly]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']


class UnidadeViewSet(viewsets.ModelViewSet):
    queryset = Unidade.objects.select_related('condominio').all()
    serializer_class = UnidadeSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_class = UnidadeFilter
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

    @action(detail=True, methods=['get'], url_path='resumo-financeiro')
    def resumo_financeiro(self, request, pk=None):
        """GET /api/unidades/{id}/resumo-financeiro/"""
        unidade = self.get_object()
        cobrancas = unidade.cobrancas.all()

        hoje = timezone.localdate()
        cobrancas.filter(
            status='PENDENTE', data_vencimento__lt=hoje
        ).update(status='VENCIDO')

        total = cobrancas.count()
        pagas = cobrancas.filter(status='PAGO').count()
        vencidas = cobrancas.filter(status='VENCIDO').count()
        pendentes = cobrancas.filter(status='PENDENTE').count()

        valor_em_aberto = cobrancas.filter(
            status__in=['PENDENTE', 'VENCIDO']
        ).aggregate(
            total=Sum(F('valor') + F('multa') + F('juros'))
        )['total'] or Decimal('0.00')

        possui_acordo = unidade.acordos.exists()

        return Response({
            'unidade': unidade.id,
            'responsavel': unidade.responsavel,
            'total_cobrancas': total,
            'total_pagas': pagas,
            'total_vencidas': vencidas,
            'total_pendentes': pendentes,
            'valor_em_aberto': float(valor_em_aberto),
            'possui_acordo': possui_acordo,
        })


class CobrancaViewSet(viewsets.ModelViewSet):
    queryset = Cobranca.objects.select_related('unidade__condominio').all()
    serializer_class = CobrancaSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_class = CobrancaFilter
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        qs = super().get_queryset()
        hoje = timezone.localdate()
        qs.filter(status='PENDENTE', data_vencimento__lt=hoje).update(status='VENCIDO')
        return qs


class AcordoViewSet(viewsets.ModelViewSet):
    queryset = Acordo.objects.prefetch_related('cobrancas', 'parcelas').select_related('unidade').all()
    serializer_class = AcordoSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_class = AcordoFilter
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']


class ParcelaAcordoViewSet(viewsets.ModelViewSet):
    queryset = ParcelaAcordo.objects.select_related('acordo__unidade').all()
    serializer_class = ParcelaAcordoSerializer
    permission_classes = [IsAdminOrReadOnly]
    # Parcelas são geradas pelo Acordo; somente admin pode atualizar via PUT/PATCH ou deletar
    http_method_names = ['get', 'put', 'patch', 'delete', 'head', 'options']

    filterset_fields = ['acordo', 'status']

    def perform_update(self, serializer):
        parcela = serializer.save()
        novo_status = parcela.status

        if novo_status != 'PAGO':
            return

        acordo = parcela.acordo
        data_pagamento = parcela.data_pagamento or timezone.localdate()
        forma_pagamento = getattr(parcela, '_forma_pagamento', None)

        # Verifica se todas as parcelas do acordo estão pagas agora
        total_parcelas = acordo.parcelas.count()
        parcelas_pagas = acordo.parcelas.filter(status='PAGO').count()
        acordo_quitado = (total_parcelas == parcelas_pagas)

        cobrancas = list(acordo.cobrancas.all())

        if acordo_quitado:
            # Acordo quitado: marca todas as cobranças como PAGO
            for cob in cobrancas:
                if cob.status not in ('PAGO', 'CANCELADO'):
                    update_fields = {
                        'status': 'PAGO',
                        'data_pagamento': data_pagamento,
                        'multa': Decimal('0.00'),
                        'juros': Decimal('0.00'),
                    }
                    if forma_pagamento:
                        update_fields['forma_pagamento'] = forma_pagamento
                    for attr, val in update_fields.items():
                        setattr(cob, attr, val)
                    cob.save(update_fields=list(update_fields.keys()))
        else:
            # Acordo parcialmente pago: distribui valor das parcelas pagas nas cobranças
            valor_pago_total = acordo.parcelas.filter(status='PAGO').aggregate(
                total=Sum('valor')
            )['total'] or Decimal('0.00')

            valor_acumulado = Decimal('0.00')
            for cob in cobrancas:
                if cob.status in ('PAGO', 'CANCELADO'):
                    continue
                valor_cob = cob.valor + cob.multa + cob.juros
                valor_acumulado += valor_cob
                if valor_acumulado <= valor_pago_total:
                    # Esta cobrança foi integralmente coberta pelas parcelas pagas
                    update_fields = {
                        'status': 'PAGO',
                        'data_pagamento': data_pagamento,
                        'multa': Decimal('0.00'),
                        'juros': Decimal('0.00'),
                    }
                    if forma_pagamento:
                        update_fields['forma_pagamento'] = forma_pagamento
                    for attr, val in update_fields.items():
                        setattr(cob, attr, val)
                    cob.save(update_fields=list(update_fields.keys()))


# Endpoints inteligentes
class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        hoje = timezone.localdate()

        # Atualizar vencidos
        Cobranca.objects.filter(
            status='PENDENTE', data_vencimento__lt=hoje
        ).update(status='VENCIDO')

        cobrancas = Cobranca.objects.all()
        pagas = cobrancas.filter(status='PAGO')
        pendentes = cobrancas.filter(status='PENDENTE')
        vencidas = cobrancas.filter(status='VENCIDO')

        valor_recebido = pagas.aggregate(
            total=Sum(F('valor') + F('multa') + F('juros'))
        )['total'] or Decimal('0.00')

        valor_em_aberto = cobrancas.filter(
            status__in=['PENDENTE', 'VENCIDO']
        ).aggregate(
            total=Sum(F('valor') + F('multa') + F('juros'))
        )['total'] or Decimal('0.00')

        return Response({
            'total_condominios': Condominio.objects.count(),
            'total_unidades': Unidade.objects.count(),
            'total_cobrancas': cobrancas.count(),
            'total_pagas': pagas.count(),
            'total_pendentes': pendentes.count(),
            'total_vencidas': vencidas.count(),
            'valor_total_recebido': float(valor_recebido),
            'valor_total_em_aberto': float(valor_em_aberto),
            'total_acordos': Acordo.objects.count(),
        })


class InadimplenciaResumoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        hoje = timezone.localdate()

        # Atualizar vencidos
        Cobranca.objects.filter(
            status='PENDENTE', data_vencimento__lt=hoje
        ).update(status='VENCIDO')

        condominios = Condominio.objects.all()
        resultado = []

        for cond in condominios:
            vencidas = Cobranca.objects.filter(
                unidade__condominio=cond,
                status='VENCIDO'
            )
            qtd = vencidas.count()
            if qtd == 0:
                continue

            valor_total = vencidas.aggregate(
                total=Sum(F('valor') + F('multa') + F('juros'))
            )['total'] or Decimal('0.00')

            resultado.append({
                'condominio_id': cond.id,
                'condominio': cond.nome,
                'qtd_cobrancas_vencidas': qtd,
                'valor_total_vencido': float(valor_total),
            })

        return Response(resultado)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        })
