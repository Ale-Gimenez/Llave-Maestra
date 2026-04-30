from django.urls import path, include
from .views import *
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'responsaveis', ResponsaveisViewSet)
router.register(r'locais', LocaisViewSet)
router.register(r'ambientes', AmbientesViewSet)
router.register(r'microcontroladores', MicrocontroladoresViewSet)
router.register(r'sensores', SensoresViewSet)
router.register(r'historicos', HistoricosViewSet)
router.register(r'usuarios', UsuariosViewSet)

urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('register/', RegisterView.as_view(), name='register'),
    path('me/', UsuarioMeView.as_view(), name='me'),

    path('', include(router.urls)),

    path('importar/locais/', importar_locais),
    path('importar/responsaveis/', importar_responsaveis),
    path('importar/ambientes/', importar_ambientes),
    path('importar/microcontroladores/', importar_microcontroladores),
    path('importar/sensores/', importar_sensores),
    path('importar/historicos/', importar_historicos),
]