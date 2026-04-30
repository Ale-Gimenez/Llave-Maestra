from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User

class Responsaveis(models.Model):
    nome = models.CharField(max_length=200)

    def __str__(self):
        return self.nome
    

class Locais(models.Model):
    local = models.CharField(max_length=200)

    def __str__(self):
        return self.local


class Ambientes(models.Model):
    descricao = models.CharField(max_length=300)
    local = models.ForeignKey(Locais, on_delete=models.CASCADE, related_name='local_ambiente')
    responsavel = models.ForeignKey(Responsaveis, on_delete=models.CASCADE, related_name='responsavel_ambiente')

    def __str__(self):
        return f"Ambiente {self.id}"
    

class Microcontroladores(models.Model):
    modelo = models.CharField(max_length=50)
    mac_address = models.CharField(max_length=50)
    latitude = models.FloatField()
    longitude = models.FloatField()
    status = models.BooleanField(default=False)
    ambiente = models.ForeignKey(Ambientes, on_delete=models.CASCADE, related_name='ambiente_mic')

    def __str__(self):
        return f"Microcontrolador {self.id}"


class Sensores(models.Model):
    SENSOR_CHOICES = [
        ('TEMPERATURA', 'Temperatura'),
        ('UMIDADE', 'Umidade'),
        ('LUMINOSIDADE', 'Luminosidade'),
        ('CONTADOR', 'Contador')
    ]
    UNIDADE_CHOICES = [
        ('°C', '°C'),
        ('%', '%'),
        ('LUX', 'lux'),
        ('UNI', 'uni')
    ]
    sensor = models.CharField(max_length=50, choices=SENSOR_CHOICES)
    unidade_med = models.CharField(max_length=5, choices=UNIDADE_CHOICES)
    status = models.BooleanField(default=False)
    mic = models.ForeignKey(Microcontroladores, on_delete=models.CASCADE, related_name='mic_sensor')

    def __str__(self):
        return f"Sensores {self.id}"
    

class Historicos(models.Model):
    valor = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)
    sensor = models.ForeignKey(Sensores, on_delete=models.CASCADE, related_name='sensor_historico')

    def __str__(self):
        return f"Históricos {self.id}"


class Usuarios(models.Model):

    TIPO_CHOICES = [
        ('ADMINISTRADOR', 'Administrador'),
        ('USUARIO', 'Usuário')
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="perfil")
    nome = models.CharField(max_length=200)
    telefone = models.CharField(max_length=30, blank=True)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)

    def __str__(self):
        return self.nome


@receiver(post_save, sender=User)
def criar_perfil_usuario(sender, instance, created, **kwargs):
    if created:
        tipo = "ADMINISTRADOR" if instance.is_superuser else "USUARIO"
        
        Usuarios.objects.get_or_create(
            user=instance,
            defaults={
                'nome': instance.username,
                'tipo': tipo,
                'telefone': ''
            }
        )