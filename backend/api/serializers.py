from rest_framework import serializers
from .models import Responsaveis, Locais, Ambientes, Microcontroladores, Sensores, Historicos, Usuarios
from django.contrib.auth.models import User


class ResponsaveisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Responsaveis
        fields = '__all__'


class LocaisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Locais
        fields = '__all__'


class AmbientesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ambientes
        fields = '__all__'


class MicrocontroladoresSerializer(serializers.ModelSerializer):
    class Meta:
        model = Microcontroladores
        fields = '__all__'


class SensoresSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sensores
        fields = '__all__'


class HistoricosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Historicos
        fields = '__all__'


class UsuariosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuarios
        fields = '__all__'


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    nome = serializers.CharField(required=False, allow_blank=True, default='')
    telefone = serializers.CharField(required=False, allow_blank=True, default='')
    tipo = serializers.ChoiceField(choices=Usuarios.TIPO_CHOICES)

    def create(self, validated_data):
        nome = validated_data.get('nome', '')
        telefone = validated_data.get('telefone', '')
        tipo = validated_data['tipo']

        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password']
        )

        if tipo == "ADMINISTRADOR":
            user.is_staff = True
            user.is_active = True
            user.save()
        else:
            user.is_staff = False
            user.is_active = True
            user.is_superuser = False
            user.save()

        return user


class UsuarioMeSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    is_superuser = serializers.BooleanField(source='user.is_superuser', read_only=True)
    is_staff = serializers.BooleanField(source='user.is_staff', read_only=True)
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)

    class Meta:
        model = Usuarios
        fields = ['id', 'nome', 'telefone', 'tipo', 'username', 'is_superuser', 'is_staff', 'is_active']
