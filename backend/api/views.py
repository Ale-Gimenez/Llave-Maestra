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


class CondominioViewSet(viewsets.ModelViewSet):
    queryset = Condominio.objects.all()
    serializer_class = CondominioSerializer
    permission_classes = [IsAuthenticated]


class UnidadeViewSet(viewsets.ModelViewSet):
    queryset = Unidade.objects.select_related('condominio').all()
    serializer_class = UnidadeSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = UnidadeFilter

    @action(detail=True, methods=['get'], url_path='resumo-financeiro')
    def resumo_financeiro(self, request, pk=None):
        """GET /api/unidades/{id}/resumo-financeiro/"""
        unidade = self.get_object()
        cobrancas = unidade.cobrancas.all()

        # Atualizar status de cobranças vencidas antes de retornar
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
    permission_classes = [IsAuthenticated]
    filterset_class = CobrancaFilter

    def get_queryset(self):
        qs = super().get_queryset()
        # Auto-atualiza PENDENTE → VENCIDO na listagem
        hoje = timezone.localdate()
        qs.filter(status='PENDENTE', data_vencimento__lt=hoje).update(status='VENCIDO')
        return qs


class AcordoViewSet(viewsets.ModelViewSet):
    queryset = Acordo.objects.prefetch_related('cobrancas', 'parcelas').select_related('unidade').all()
    serializer_class = AcordoSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = AcordoFilter


class ParcelaAcordoViewSet(viewsets.ModelViewSet):
    queryset = ParcelaAcordo.objects.select_related('acordo__unidade').all()
    serializer_class = ParcelaAcordoSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'head', 'options']  # Parcelas são geradas pelo Acordo

    filterset_fields = ['acordo', 'status']


# --- Endpoints inteligentes ---

class DashboardView(APIView):
    """GET /api/dashboard/"""
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
    """GET /api/inadimplencia/resumo/"""
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
