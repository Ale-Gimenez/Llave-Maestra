import django_filters
from .models import Responsaveis, Locais, Ambientes, Microcontroladores, Sensores, Historicos, Usuarios


class ResponsaveisFilter(django_filters.FilterSet):
    nome = django_filters.CharFilter(field_name='nome', lookup_expr='icontains')

    class Meta:
        model = Responsaveis
        fields = ['nome']


class LocaisFilter(django_filters.FilterSet):
    local = django_filters.CharFilter(field_name='local', lookup_expr='icontains')

    class Meta:
        model = Locais
        fields = ['local']


class AmbientesFilter(django_filters.FilterSet):
    descricao = django_filters.CharFilter(field_name='descricao', lookup_expr='icontains')
    local = django_filters.NumberFilter(field_name='local_id')
    responsavel = django_filters.NumberFilter(field_name='responsavel_id')

    class Meta:
        model = Ambientes
        fields = ['descricao', 'local', 'responsavel']


class MicrocontroladoresFilter(django_filters.FilterSet):
    modelo = django_filters.CharFilter(field_name='modelo', lookup_expr='icontains')
    mac_address = django_filters.CharFilter(field_name='mac_address', lookup_expr='icontains')
    status = django_filters.BooleanFilter(field_name='status')
    ambiente = django_filters.NumberFilter(field_name='ambiente_id')

    class Meta:
        model = Microcontroladores
        fields = ['modelo', 'mac_address', 'status', 'ambiente']


class SensoresFilter(django_filters.FilterSet):
    sensor = django_filters.ChoiceFilter(field_name='sensor', choices=Sensores.SENSOR_CHOICES)
    unidade_med = django_filters.ChoiceFilter(field_name='unidade_med', choices=Sensores.UNIDADE_CHOICES)
    status = django_filters.BooleanFilter(field_name='status')
    mic = django_filters.NumberFilter(field_name='mic_id')

    class Meta:
        model = Sensores
        fields = ['sensor', 'unidade_med', 'status', 'mic']


class HistoricosFilter(django_filters.FilterSet):
    timestamp_min = django_filters.DateTimeFilter(field_name='timestamp', lookup_expr='gte')
    timestamp_max = django_filters.DateTimeFilter(field_name='timestamp', lookup_expr='lte')
    valor_min = django_filters.NumberFilter(field_name='valor', lookup_expr='gte')
    valor_max = django_filters.NumberFilter(field_name='valor', lookup_expr='lte')
    sensor = django_filters.NumberFilter(field_name='sensor_id')
    # CORREÇÃO: permite filtrar pelo tipo do sensor (ex: ?sensor__sensor=TEMPERATURA)
    sensor__sensor = django_filters.ChoiceFilter(
        field_name='sensor__sensor',
        choices=Sensores.SENSOR_CHOICES
    )

    class Meta:
        model = Historicos
        fields = ['sensor', 'timestamp', 'valor']


class UsuariosFilter(django_filters.FilterSet):
    nome = django_filters.CharFilter(field_name='nome', lookup_expr='icontains')
    tipo = django_filters.ChoiceFilter(field_name='tipo', choices=Usuarios.TIPO_CHOICES)

    class Meta:
        model = Usuarios
        fields = ['nome', 'tipo']
