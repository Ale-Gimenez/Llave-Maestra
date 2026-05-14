from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CondominioViewSet, UnidadeViewSet, CobrancaViewSet,
    AcordoViewSet, ParcelaAcordoViewSet,
    DashboardView, InadimplenciaResumoView
)

router = DefaultRouter()
router.register(r'condominios', CondominioViewSet, basename='condominio')
router.register(r'unidades', UnidadeViewSet, basename='unidade')
router.register(r'cobrancas', CobrancaViewSet, basename='cobranca')
router.register(r'acordos', AcordoViewSet, basename='acordo')
router.register(r'parcelas-acordo', ParcelaAcordoViewSet, basename='parcela-acordo')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('inadimplencia/resumo/', InadimplenciaResumoView.as_view(), name='inadimplencia-resumo'),
]
