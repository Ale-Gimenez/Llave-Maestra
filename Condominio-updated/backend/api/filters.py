import django_filters
from .models import Cobranca, Acordo, Unidade


class CobrancaFilter(django_filters.FilterSet):
    condominio = django_filters.NumberFilter(field_name='unidade__condominio__id', label='Condomínio ID')
    unidade = django_filters.NumberFilter(field_name='unidade__id', label='Unidade ID')
    status = django_filters.CharFilter(field_name='status', lookup_expr='iexact')
    competencia = django_filters.DateFilter(field_name='competencia')
    competencia_mes = django_filters.NumberFilter(field_name='competencia', lookup_expr='month')
    competencia_ano = django_filters.NumberFilter(field_name='competencia', lookup_expr='year')
    vencimento_de = django_filters.DateFilter(field_name='data_vencimento', lookup_expr='gte')
    vencimento_ate = django_filters.DateFilter(field_name='data_vencimento', lookup_expr='lte')

    class Meta:
        model = Cobranca
        fields = ['condominio', 'unidade', 'status', 'competencia']


class AcordoFilter(django_filters.FilterSet):
    unidade = django_filters.NumberFilter(field_name='unidade__id')
    criado_de = django_filters.DateFilter(field_name='criado_em', lookup_expr='date__gte')
    criado_ate = django_filters.DateFilter(field_name='criado_em', lookup_expr='date__lte')

    class Meta:
        model = Acordo
        fields = ['unidade']


class UnidadeFilter(django_filters.FilterSet):
    condominio = django_filters.NumberFilter(field_name='condominio__id')
    status = django_filters.CharFilter(field_name='status', lookup_expr='iexact')

    class Meta:
        model = Unidade
        fields = ['condominio', 'status']
