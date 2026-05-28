from django.contrib import admin
from .models import Condominio, Unidade, Cobranca, Acordo, ParcelaAcordo


@admin.register(Condominio)
class CondominioAdmin(admin.ModelAdmin):
    list_display = ['nome', 'cnpj', 'endereco', 'criado_em']
    search_fields = ['nome', 'cnpj']


@admin.register(Unidade)
class UnidadeAdmin(admin.ModelAdmin):
    list_display = ['numero', 'bloco', 'condominio', 'responsavel', 'status']
    list_filter = ['condominio', 'status']
    search_fields = ['numero', 'responsavel']


@admin.register(Cobranca)
class CobrancaAdmin(admin.ModelAdmin):
    list_display = ['unidade', 'competencia', 'valor', 'status', 'data_vencimento', 'data_pagamento']
    list_filter = ['status', 'forma_pagamento']
    search_fields = ['unidade__responsavel', 'unidade__numero']


class ParcelaInline(admin.TabularInline):
    model = ParcelaAcordo
    extra = 0
    readonly_fields = ['numero_parcela', 'valor', 'data_vencimento']


@admin.register(Acordo)
class AcordoAdmin(admin.ModelAdmin):
    list_display = ['id', 'unidade', 'quantidade_parcelas', 'valor_total', 'criado_em']
    inlines = [ParcelaInline]


@admin.register(ParcelaAcordo)
class ParcelaAcordoAdmin(admin.ModelAdmin):
    list_display = ['acordo', 'numero_parcela', 'valor', 'data_vencimento', 'status']
    list_filter = ['status']
