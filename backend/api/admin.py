from django.contrib import admin
from .models import Responsaveis, Locais, Ambientes, Microcontroladores, Sensores, Historicos, Usuarios

admin.site.register(Responsaveis)
admin.site.register(Locais)
admin.site.register(Ambientes)
admin.site.register(Microcontroladores)
admin.site.register(Sensores)
admin.site.register(Historicos)
admin.site.register(Usuarios)
