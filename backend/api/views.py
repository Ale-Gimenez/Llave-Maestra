from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework import status
from .models import Responsaveis, Locais, Ambientes, Microcontroladores, Sensores, Historicos, Usuarios
from .serializers import *
from .permissions import IsAdminOrReadOnly
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView, RetrieveAPIView
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from .filters import *
from django.utils import timezone
from datetime import timedelta
import pandas as pd


class ResponsaveisViewSet(ModelViewSet):
    queryset = Responsaveis.objects.all()
    serializer_class = ResponsaveisSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = ResponsaveisFilter
    permission_classes = [IsAdminOrReadOnly]


class LocaisViewSet(ModelViewSet):
    queryset = Locais.objects.all()
    serializer_class = LocaisSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = LocaisFilter
    permission_classes = [IsAdminOrReadOnly]


class AmbientesViewSet(ModelViewSet):
    queryset = Ambientes.objects.all()
    serializer_class = AmbientesSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = AmbientesFilter
    permission_classes = [IsAdminOrReadOnly]


class MicrocontroladoresViewSet(ModelViewSet):
    queryset = Microcontroladores.objects.all()
    serializer_class = MicrocontroladoresSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = MicrocontroladoresFilter
    permission_classes = [IsAdminOrReadOnly]


class SensoresViewSet(ModelViewSet):
    queryset = Sensores.objects.all()
    serializer_class = SensoresSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = SensoresFilter
    permission_classes = [IsAdminOrReadOnly]
    

class HistoricosViewSet(ModelViewSet):
    queryset = Historicos.objects.all()
    serializer_class = HistoricosSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = HistoricosFilter
    permission_classes = [IsAdminOrReadOnly]

    def perform_create(self, serializer):
        sensor = serializer.validated_data.get('sensor')
        if not sensor.status:
            raise ValidationError({"erro": "Não é possível registrar medições para um sensor inativo."})
        serializer.save()

    @action(detail=False, methods=['get'], url_path='recentes')
    def recentes(self, request):
        ultimas_24h = timezone.now() - timedelta(hours=24)
        qs = Historicos.objects.filter(timestamp__gte=ultimas_24h).order_by('-timestamp')
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class UsuariosViewSet(ModelViewSet):
    queryset = Usuarios.objects.all()
    serializer_class = UsuariosSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = UsuariosFilter

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_staff:
            return qs
        return qs.filter(user=self.request.user)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Usuário criado com sucesso."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UsuarioMeView(RetrieveAPIView):
    serializer_class = UsuarioMeSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.perfil


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def importar_locais(request):
    arquivo = request.FILES.get("file")
    if not arquivo:
        return Response({"detail": "Nenhum arquivo enviado."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        df = pd.read_excel(arquivo)
        if 'local' not in df.columns:
            return Response({"detail": "Coluna obrigatória ausente: local"}, status=status.HTTP_400_BAD_REQUEST)

        criados = 0
        for _, row in df.iterrows():
            Locais.objects.create(local=str(row['local']).strip())
            criados += 1

        return Response({"detail": "Importação concluída.", "criados": criados})
    except Exception as e:
        return Response({"detail": f"Erro ao importar arquivo: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def importar_responsaveis(request):
    arquivo = request.FILES.get("file")
    if not arquivo:
        return Response({"detail": "Nenhum arquivo enviado."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        df = pd.read_excel(arquivo)
        if 'responsavel' not in df.columns:
            return Response({"detail": "Coluna obrigatória ausente: responsavel"}, status=status.HTTP_400_BAD_REQUEST)

        criados = 0
        for _, row in df.iterrows():
            Responsaveis.objects.create(nome=str(row['responsavel']).strip())
            criados += 1

        return Response({"detail": "Importação concluída.", "criados": criados})
    except Exception as e:
        return Response({"detail": f"Erro ao importar arquivo: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


def _buscar_local(valor):
    try:
        return Locais.objects.get(pk=int(valor))
    except (ValueError, TypeError):
        return Locais.objects.get(local=str(valor).strip())


def _buscar_responsavel(valor):
    try:
        return Responsaveis.objects.get(pk=int(valor))
    except (ValueError, TypeError):
        return Responsaveis.objects.get(nome=str(valor).strip())


def _buscar_ambiente(valor):
    try:
        return Ambientes.objects.get(pk=int(valor))
    except (ValueError, TypeError):
        return Ambientes.objects.get(descricao=str(valor).strip())


def _buscar_microcontrolador(valor):
    try:
        return Microcontroladores.objects.get(pk=int(valor))
    except (ValueError, TypeError):
        return Microcontroladores.objects.get(mac_address=str(valor).strip())


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def importar_ambientes(request):
    arquivo = request.FILES.get("file")
    if not arquivo:
        return Response({"detail": "Nenhum arquivo enviado."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        df = pd.read_excel(arquivo)
        for coluna in ['local', 'descricao', 'responsavel']:
            if coluna not in df.columns:
                return Response({"detail": f"Coluna obrigatória ausente: {coluna}"}, status=status.HTTP_400_BAD_REQUEST)

        erros = []
        criados, ignorados = 0, 0

        for i, row in df.iterrows():
            try:
                local_obj = _buscar_local(row['local'])
            except (Locais.DoesNotExist, Exception):
                erros.append(f"Linha {i+2}: Local '{row['local']}' não encontrado.")
                continue

            try:
                responsavel_obj = _buscar_responsavel(row['responsavel'])
            except (Responsaveis.DoesNotExist, Exception):
                erros.append(f"Linha {i+2}: Responsável '{row['responsavel']}' não encontrado.")
                continue

            _, created = Ambientes.objects.get_or_create(
                descricao=row['descricao'],
                defaults={'local': local_obj, 'responsavel': responsavel_obj}
            )
            if created:
                criados += 1
            else:
                ignorados += 1

        resposta = {"detail": "Importação concluída.", "criados": criados, "ignorados (já existiam)": ignorados}
        if erros:
            resposta["erros"] = erros
        return Response(resposta)
    except Exception as e:
        return Response({"detail": f"Erro ao importar arquivo: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def importar_microcontroladores(request):
    arquivo = request.FILES.get("file")
    if not arquivo:
        return Response({"detail": "Nenhum arquivo enviado."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        df = pd.read_excel(arquivo)
        for coluna in ['modelo', 'mac_address', 'latitude', 'longitude', 'status', 'ambiente']:
            if coluna not in df.columns:
                return Response({"detail": f"Coluna obrigatória ausente: {coluna}"}, status=status.HTTP_400_BAD_REQUEST)

        erros = []
        criados, ignorados = 0, 0

        for i, row in df.iterrows():
            try:
                ambiente_obj = _buscar_ambiente(row['ambiente'])
            except (Ambientes.DoesNotExist, Exception):
                erros.append(f"Linha {i+2}: Ambiente '{row['ambiente']}' não encontrado.")
                continue

            _, created = Microcontroladores.objects.get_or_create(
                mac_address=row['mac_address'],
                defaults={
                    'modelo': row['modelo'],
                    'latitude': row['latitude'],
                    'longitude': row['longitude'],
                    'status': bool(row['status']),
                    'ambiente': ambiente_obj,
                }
            )
            if created:
                criados += 1
            else:
                ignorados += 1

        resposta = {"detail": "Importação concluída.", "criados": criados, "ignorados (já existiam)": ignorados}
        if erros:
            resposta["erros"] = erros
        return Response(resposta)
    except Exception as e:
        return Response({"detail": f"Erro ao importar arquivo: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def importar_sensores(request):
    arquivo = request.FILES.get("file")
    if not arquivo:
        return Response({"detail": "Nenhum arquivo enviado."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        df = pd.read_excel(arquivo)
        for coluna in ['sensor', 'unidade_med', 'mic', 'status']:
            if coluna not in df.columns:
                return Response({"detail": f"Coluna obrigatória ausente: {coluna}"}, status=status.HTTP_400_BAD_REQUEST)

        SENSOR_MAP = {
            'temperatura':  'TEMPERATURA',
            'umidade':      'UMIDADE',
            'luminosidade': 'LUMINOSIDADE',
            'contador':     'CONTADOR',
        }
        
        UNIDADE_MAP = {
            'ºc':  '°C', 
            '°c':  '°C', 
            'c':   '°C',
            '%':   '%',
            'lux': 'LUX',
            'uni': 'UNI',
            'uni.':'UNI',
            'num': 'UNI',
        }

        erros = []
        criados, ignorados = 0, 0

        for i, row in df.iterrows():
            sensor_raw  = str(row['sensor']).strip()
            unidade_raw = str(row['unidade_med']).strip()
            sensor_val  = SENSOR_MAP.get(sensor_raw.lower(), sensor_raw.upper())
            unidade_val = UNIDADE_MAP.get(unidade_raw.lower(), unidade_raw)

            try:
                mic_obj = _buscar_microcontrolador(row['mic'])
            except (Microcontroladores.DoesNotExist, Exception):
                erros.append(f"Linha {i+2}: Microcontrolador '{row['mic']}' não encontrado.")
                continue

            _, created = Sensores.objects.get_or_create(
                sensor=sensor_val,
                mic=mic_obj,
                defaults={
                    'unidade_med': unidade_val,
                    'status': bool(row['status']),
                }
            )
            if created:
                criados += 1
            else:
                ignorados += 1

        resposta = {"detail": "Importação concluída.", "criados": criados, "ignorados (já existiam)": ignorados}
        if erros:
            resposta["erros"] = erros
        return Response(resposta)
    except Exception as e:
        return Response({"detail": f"Erro ao importar arquivo: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def importar_historicos(request):
    arquivo = request.FILES.get("file")
    if not arquivo:
        return Response({"detail": "Nenhum arquivo enviado."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        df = pd.read_excel(arquivo)
        for coluna in ['sensor', 'valor', 'timestamp']:
            if coluna not in df.columns:
                return Response({"detail": f"Coluna obrigatória ausente: {coluna}"}, status=status.HTTP_400_BAD_REQUEST)

        erros = []
        criados = 0

        for i, row in df.iterrows():
            try:
                sensor_id = int(row['sensor'])
                sensor_obj = Sensores.objects.get(id=sensor_id)
            except (ValueError, TypeError):
                erros.append(f"Linha {i+2}: ID de sensor inválido '{row['sensor']}'.")
                continue
            except Sensores.DoesNotExist:
                erros.append(f"Linha {i+2}: Sensor com ID '{row['sensor']}' não encontrado.")
                continue

            # Regra de negócio: sensor inativo não recebe medições
            if not sensor_obj.status:
                erros.append(f"Linha {i+2}: Sensor ID {sensor_obj.id} ({sensor_obj.sensor}) está inativo.")
                continue

            Historicos.objects.create(
                sensor=sensor_obj,
                valor=row['valor'],
                timestamp=row['timestamp'],
            )
            criados += 1

        resposta = {"detail": "Importação concluída.", "criados": criados}
        if erros:
            resposta["erros"] = erros
        return Response(resposta)
    except Exception as e:
        return Response({"detail": f"Erro ao importar arquivo: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)