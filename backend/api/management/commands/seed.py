from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal
import datetime
from api.models import Condominio, Unidade, Cobranca, Acordo, ParcelaAcordo


class Command(BaseCommand):
    help = 'Popula o banco com dados de exemplo'

    def handle(self, *args, **kwargs):
        self.stdout.write('Criando usuários...')
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@condominio.com', 'admin123')
        if not User.objects.filter(username='user').exists():
            User.objects.create_user('user', 'user@condominio.com', 'user123')

        self.stdout.write('Criando condomínios...')
        cond1, _ = Condominio.objects.get_or_create(nome='Residencial Primavera',
            defaults={'cnpj': '12.345.678/0001-90', 'endereco': 'Rua das Flores, 100 - Campinas/SP'})
        cond2, _ = Condominio.objects.get_or_create(nome='Condomínio Sol Nascente',
            defaults={'cnpj': '98.765.432/0001-10', 'endereco': 'Av. das Acácias, 200 - Campinas/SP'})
        cond3, _ = Condominio.objects.get_or_create(nome='Edifício Central Park',
            defaults={'endereco': 'Rua XV de Novembro, 300 - Campinas/SP'})

        self.stdout.write('Criando unidades...')
        dados_unidades = [
            (cond1, '101', 'A', 'Carlos Silva', 'OCUPADO'),
            (cond1, '102', 'A', 'Ana Oliveira', 'OCUPADO'),
            (cond1, '201', 'B', 'Roberto Santos', 'OCUPADO'),
            (cond1, '202', 'B', 'Maria Costa', 'VAGO'),
            (cond2, '01', None, 'João Ferreira', 'OCUPADO'),
            (cond2, '02', None, 'Fernanda Lima', 'OCUPADO'),
            (cond2, '03', None, 'Paulo Mendes', 'VAGO'),
            (cond3, '501', 'Torre A', 'Lucia Andrade', 'OCUPADO'),
            (cond3, '502', 'Torre A', 'Marcos Ramos', 'OCUPADO'),
        ]
        unidades = []
        for cond, num, bloco, resp, st in dados_unidades:
            u, _ = Unidade.objects.get_or_create(condominio=cond, numero=num, bloco=bloco,
                defaults={'responsavel': resp, 'status': st})
            unidades.append(u)

        hoje = timezone.localdate()
        self.stdout.write('Criando cobranças...')

        def cob(unidade, meses_atras, dias_venc, valor, status='PENDENTE', dias_pag=None, forma=None):
            ref = hoje.replace(day=1)
            m, y = ref.month - meses_atras, ref.year
            while m <= 0:
                m += 12; y -= 1
            competencia = datetime.date(y, m, 1)
            vencimento = hoje + datetime.timedelta(days=dias_venc)
            data_pag = (hoje + datetime.timedelta(days=dias_pag)) if dias_pag is not None else None
            c, created = Cobranca.objects.get_or_create(unidade=unidade, competencia=competencia,
                defaults={'data_vencimento': vencimento, 'valor': Decimal(str(valor)),
                          'status': status, 'data_pagamento': data_pag, 'forma_pagamento': forma})
            if created and status == 'PAGO' and data_pag and data_pag > vencimento:
                multa, juros = c.calcular_multa_juros(data_pag)
                c.multa = multa; c.juros = juros; c.save()
            return c

        # Carlos Silva - 2 vencidas
        c1 = cob(unidades[0], 2, -45, 850.00, 'VENCIDO')
        c2 = cob(unidades[0], 1, -15, 850.00, 'VENCIDO')
        cob(unidades[0], 0, 10, 850.00, 'PENDENTE')
        # Ana Oliveira - em dia
        cob(unidades[1], 1, -20, 720.00, 'PAGO', -22, 'PIX')
        cob(unidades[1], 0, 5, 720.00, 'PENDENTE')
        # Roberto - pagou com atraso
        cob(unidades[2], 2, -60, 900.00, 'PAGO', -50, 'BOLETO')
        # João Ferreira - vencida
        c3 = cob(unidades[4], 1, -30, 650.00, 'VENCIDO')
        cob(unidades[4], 0, 15, 650.00, 'PENDENTE')
        # Fernanda - em dia
        cob(unidades[5], 1, -10, 680.00, 'PAGO', -9, 'PIX')
        # Lucia - 3 vencidas
        c4 = cob(unidades[7], 3, -90, 1200.00, 'VENCIDO')
        c5 = cob(unidades[7], 2, -60, 1200.00, 'VENCIDO')
        c6 = cob(unidades[7], 1, -30, 1200.00, 'VENCIDO')

        self.stdout.write('Criando acordo...')
        if not Acordo.objects.filter(unidade=unidades[0]).exists():
            vt = sum(c.valor + c.multa + c.juros for c in [c1, c2])
            a = Acordo.objects.create(unidade=unidades[0], quantidade_parcelas=3,
                data_primeiro_vencimento=hoje + datetime.timedelta(days=10),
                valor_total=vt, observacao='Acordo referente às cobranças vencidas')
            a.cobrancas.set([c1, c2])
            vd = a.data_primeiro_vencimento
            vp = (vt / 3).quantize(Decimal('0.01'))
            for i in range(1, 4):
                v = vp if i < 3 else vt - vp * 2
                ParcelaAcordo.objects.create(acordo=a, numero_parcela=i,
                    valor=v.quantize(Decimal('0.01')), data_vencimento=vd)
                vd = vd.replace(month=vd.month % 12 + 1, year=vd.year + (1 if vd.month == 12 else 0))

        self.stdout.write(self.style.SUCCESS('Seed concluído!'))
        self.stdout.write('Acesso: admin/admin123 e user/user123')
