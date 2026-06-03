from django.db import models
from django.utils import timezone
from decimal import Decimal


class Condominio(models.Model):
    nome = models.CharField(max_length=200)
    cnpj = models.CharField(max_length=18, blank=True, null=True, unique=True)
    endereco = models.CharField(max_length=300, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Condomínio'
        verbose_name_plural = 'Condomínios'
        ordering = ['nome']

    def __str__(self):
        return self.nome


class Unidade(models.Model):
    STATUS_CHOICES = [
        ('OCUPADO', 'Ocupado'),
        ('VAGO', 'Vago'),
    ]

    condominio = models.ForeignKey(
        Condominio, on_delete=models.CASCADE, related_name='unidades'
    )
    numero = models.CharField(max_length=20)
    bloco = models.CharField(max_length=20, blank=True, null=True)
    responsavel = models.CharField(max_length=200)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='OCUPADO')
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Unidade'
        verbose_name_plural = 'Unidades'
        ordering = ['condominio', 'bloco', 'numero']
        unique_together = ['condominio', 'numero', 'bloco']

    def __str__(self):
        bloco_str = f' - Bloco {self.bloco}' if self.bloco else ''
        return f'Unidade {self.numero}{bloco_str} ({self.condominio.nome})'


class Cobranca(models.Model):
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('PAGO', 'Pago'),
        ('VENCIDO', 'Vencido'),
        ('CANCELADO', 'Cancelado'),
    ]

    FORMA_PAGAMENTO_CHOICES = [
        ('BOLETO', 'Boleto'),
        ('PIX', 'Pix'),
        ('CARTAO', 'Cartão'),
        ('TRANSFERENCIA', 'Transferência'),
        ('DINHEIRO', 'Dinheiro'),
    ]

    unidade = models.ForeignKey(
        Unidade, on_delete=models.CASCADE, related_name='cobrancas'
    )
    competencia = models.DateField(help_text='Mês/ano de referência da cobrança (ex: 2026-05-01)')
    data_vencimento = models.DateField()
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDENTE')
    data_pagamento = models.DateField(blank=True, null=True)
    forma_pagamento = models.CharField(
        max_length=15, choices=FORMA_PAGAMENTO_CHOICES, blank=True, null=True
    )
    multa = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    juros = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    observacao = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Cobrança'
        verbose_name_plural = 'Cobranças'
        ordering = ['-data_vencimento']

    def __str__(self):
        return f'Cobrança {self.competencia} - {self.unidade} [{self.status}]'

    def calcular_multa_juros(self, data_pagamento=None):
        data_ref = data_pagamento or timezone.localdate()
        if data_ref > self.data_vencimento:
            dias_atraso = (data_ref - self.data_vencimento).days
            multa = self.valor * Decimal('0.02')
            juros = self.valor * Decimal('0.00033') * dias_atraso
            return multa.quantize(Decimal('0.01')), juros.quantize(Decimal('0.01'))
        return Decimal('0.00'), Decimal('0.00')

    def valor_total(self):
        return self.valor + self.multa + self.juros

    def atualizar_status_vencido(self):
        if self.status == 'PENDENTE' and timezone.localdate() > self.data_vencimento:
            self.status = 'VENCIDO'
            self.save(update_fields=['status'])


class Acordo(models.Model):
    unidade = models.ForeignKey(
        Unidade, on_delete=models.CASCADE, related_name='acordos'
    )
    cobrancas = models.ManyToManyField(
        Cobranca, related_name='acordos'
    )
    quantidade_parcelas = models.PositiveIntegerField()
    data_primeiro_vencimento = models.DateField()
    valor_total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    observacao = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Acordo'
        verbose_name_plural = 'Acordos'
        ordering = ['-criado_em']

    def __str__(self):
        return f'Acordo #{self.pk} - {self.unidade} ({self.quantidade_parcelas}x)'


class ParcelaAcordo(models.Model):
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('PAGO', 'Pago'),
        ('VENCIDO', 'Vencido'),
    ]

    acordo = models.ForeignKey(
        Acordo, on_delete=models.CASCADE, related_name='parcelas'
    )
    numero_parcela = models.PositiveIntegerField()
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    data_vencimento = models.DateField()
    data_pagamento = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDENTE')

    class Meta:
        verbose_name = 'Parcela do Acordo'
        verbose_name_plural = 'Parcelas do Acordo'
        ordering = ['acordo', 'numero_parcela']
        unique_together = ['acordo', 'numero_parcela']

    def __str__(self):
        return f'Parcela {self.numero_parcela}/{self.acordo.quantidade_parcelas} - Acordo #{self.acordo.pk}'
