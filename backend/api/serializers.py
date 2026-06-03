from rest_framework import serializers
from django.utils import timezone
from decimal import Decimal
from .models import Condominio, Unidade, Cobranca, Acordo, ParcelaAcordo
import datetime


class CondominioSerializer(serializers.ModelSerializer):
    total_unidades = serializers.SerializerMethodField()

    class Meta:
        model = Condominio
        fields = ['id', 'nome', 'cnpj', 'endereco', 'total_unidades', 'criado_em', 'atualizado_em']
        read_only_fields = ['id', 'criado_em', 'atualizado_em']

    def get_total_unidades(self, obj):
        return obj.unidades.count()


class UnidadeSerializer(serializers.ModelSerializer):
    condominio_id = serializers.PrimaryKeyRelatedField(
        queryset=Condominio.objects.all(), source='condominio'
    )
    condominio_nome = serializers.CharField(source='condominio.nome', read_only=True)

    class Meta:
        model = Unidade
        fields = [
            'id', 'condominio_id', 'condominio_nome',
            'numero', 'bloco', 'responsavel', 'status',
            'criado_em', 'atualizado_em'
        ]
        read_only_fields = ['id', 'criado_em', 'atualizado_em']


class CobrancaSerializer(serializers.ModelSerializer):
    unidade_id = serializers.PrimaryKeyRelatedField(
        queryset=Unidade.objects.all(), source='unidade'
    )
    unidade_info = serializers.SerializerMethodField()
    valor_total = serializers.SerializerMethodField()
    dias_atraso = serializers.SerializerMethodField()

    class Meta:
        model = Cobranca
        fields = [
            'id', 'unidade_id', 'unidade_info',
            'competencia', 'data_vencimento', 'valor',
            'status', 'data_pagamento', 'forma_pagamento',
            'multa', 'juros', 'valor_total', 'dias_atraso',
            'observacao', 'criado_em', 'atualizado_em'
        ]
        read_only_fields = ['id', 'multa', 'juros', 'criado_em', 'atualizado_em']

    def get_unidade_info(self, obj):
        return str(obj.unidade)

    def get_valor_total(self, obj):
        return float(obj.valor_total())

    def get_dias_atraso(self, obj):
        today = timezone.localdate()
        if obj.status in ('VENCIDO',) and not obj.data_pagamento:
            return max((today - obj.data_vencimento).days, 0)
        if obj.data_pagamento and obj.data_pagamento > obj.data_vencimento:
            return (obj.data_pagamento - obj.data_vencimento).days
        return 0

    def validate(self, data):
        status = data.get('status', getattr(self.instance, 'status', 'PENDENTE'))
        data_pagamento = data.get('data_pagamento', getattr(self.instance, 'data_pagamento', None))

        # data_pagamento obrigatória quando PAGO
        if status == 'PAGO' and not data_pagamento:
            raise serializers.ValidationError(
                {'data_pagamento': 'Campo obrigatório quando status é PAGO.'}
            )

        # forma_pagamento recomendada quando PAGO
        forma = data.get('forma_pagamento', getattr(self.instance, 'forma_pagamento', None))
        if status == 'PAGO' and not forma:
            raise serializers.ValidationError(
                {'forma_pagamento': 'Informe a forma de pagamento quando status é PAGO.'}
            )

        return data

    def update(self, instance, validated_data):
        status = validated_data.get('status', instance.status)
        data_pagamento = validated_data.get('data_pagamento', instance.data_pagamento)
        data_vencimento = validated_data.get('data_vencimento', instance.data_vencimento)

        # Calcular multa/juros se pagou após o vencimento
        if status == 'PAGO' and data_pagamento and data_pagamento > data_vencimento:
            valor = validated_data.get('valor', instance.valor)
            dias = (data_pagamento - data_vencimento).days
            multa = valor * Decimal('0.02')
            juros = valor * Decimal('0.00033') * dias
            validated_data['multa'] = multa.quantize(Decimal('0.01'))
            validated_data['juros'] = juros.quantize(Decimal('0.01'))
        elif status == 'PAGO':
            validated_data['multa'] = Decimal('0.00')
            validated_data['juros'] = Decimal('0.00')

        return super().update(instance, validated_data)

    def create(self, validated_data):
        status = validated_data.get('status', 'PENDENTE')
        data_pagamento = validated_data.get('data_pagamento')
        data_vencimento = validated_data.get('data_vencimento')

        if status == 'PAGO' and data_pagamento and data_pagamento > data_vencimento:
            valor = validated_data['valor']
            dias = (data_pagamento - data_vencimento).days
            multa = valor * Decimal('0.02')
            juros = valor * Decimal('0.00033') * dias
            validated_data['multa'] = multa.quantize(Decimal('0.01'))
            validated_data['juros'] = juros.quantize(Decimal('0.01'))

        return super().create(validated_data)


class ParcelaAcordoSerializer(serializers.ModelSerializer):
    acordo_id = serializers.PrimaryKeyRelatedField(
        queryset=Acordo.objects.all(), source='acordo', read_only=False, required=False
    )
    forma_pagamento = serializers.ChoiceField(
        choices=['PIX', 'BOLETO', 'CARTAO', 'TRANSFERENCIA', 'DINHEIRO'],
        write_only=True, required=False, allow_blank=True
    )

    class Meta:
        model = ParcelaAcordo
        fields = [
            'id', 'acordo_id', 'numero_parcela',
            'valor', 'data_vencimento', 'data_pagamento', 'status',
            'forma_pagamento'
        ]
        read_only_fields = ['id', 'numero_parcela', 'valor', 'data_vencimento']

    def update(self, instance, validated_data):
        # Remove forma_pagamento antes de salvar (não existe no model de parcela)
        forma_pagamento = validated_data.pop('forma_pagamento', None)
        instance = super().update(instance, validated_data)
        # Guarda temporariamente para uso no perform_update da view
        instance._forma_pagamento = forma_pagamento
        return instance


class AcordoSerializer(serializers.ModelSerializer):
    unidade_id = serializers.PrimaryKeyRelatedField(
        queryset=Unidade.objects.all(), source='unidade'
    )
    unidade_info = serializers.CharField(source='unidade.__str__', read_only=True)
    cobrancas_ids = serializers.PrimaryKeyRelatedField(
        queryset=Cobranca.objects.all(), source='cobrancas', many=True
    )
    parcelas = ParcelaAcordoSerializer(many=True, read_only=True)

    class Meta:
        model = Acordo
        fields = [
            'id', 'unidade_id', 'unidade_info',
            'cobrancas_ids', 'quantidade_parcelas',
            'data_primeiro_vencimento', 'valor_total',
            'observacao', 'parcelas', 'criado_em'
        ]
        read_only_fields = ['id', 'valor_total', 'criado_em']

    def validate(self, data):
        unidade = data.get('unidade', getattr(self.instance, 'unidade', None))
        cobrancas = data.get('cobrancas', [])

        if not cobrancas:
            raise serializers.ValidationError(
                {'cobrancas_ids': 'Informe ao menos uma cobrança vencida.'}
            )

        # Todas as cobranças devem ser da mesma unidade
        for c in cobrancas:
            if c.unidade_id != unidade.id:
                raise serializers.ValidationError(
                    {'cobrancas_ids': f'Cobrança #{c.id} não pertence à unidade informada.'}
                )
            if c.status not in ('VENCIDO', 'PENDENTE'):
                raise serializers.ValidationError(
                    {'cobrancas_ids': f'Cobrança #{c.id} não está vencida/pendente.'}
                )

        qtd = data.get('quantidade_parcelas', 1)
        if qtd < 1:
            raise serializers.ValidationError(
                {'quantidade_parcelas': 'Quantidade de parcelas deve ser maior que zero.'}
            )

        return data

    def create(self, validated_data):
        cobrancas = validated_data.pop('cobrancas')
        valor_total = sum(
            c.valor + c.multa + c.juros for c in cobrancas
        )
        validated_data['valor_total'] = valor_total

        acordo = Acordo.objects.create(**validated_data)
        acordo.cobrancas.set(cobrancas)

        # Gerar parcelas automaticamente
        qtd = acordo.quantidade_parcelas
        valor_parcela = (valor_total / qtd).quantize(Decimal('0.01'))
        data_venc = acordo.data_primeiro_vencimento

        for i in range(1, qtd + 1):
            # Última parcela absorve diferença de arredondamento
            if i == qtd:
                valor_esta_parcela = valor_total - valor_parcela * (qtd - 1)
            else:
                valor_esta_parcela = valor_parcela

            ParcelaAcordo.objects.create(
                acordo=acordo,
                numero_parcela=i,
                valor=valor_esta_parcela.quantize(Decimal('0.01')),
                data_vencimento=data_venc,
            )
            # Próximo mês
            if data_venc.month == 12:
                data_venc = data_venc.replace(year=data_venc.year + 1, month=1)
            else:
                data_venc = data_venc.replace(month=data_venc.month + 1)

        return acordo
