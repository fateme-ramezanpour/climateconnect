# Generated by Django 3.2.23 on 2024-12-12 12:06

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('hubs', '0030_auto_20241202_1149'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='hubthemecolor',
            name='background_default',
        ),
        migrations.RemoveField(
            model_name='hubthemecolor',
            name='background_paper',
        ),
        migrations.AddField(
            model_name='hubtheme',
            name='background_default',
            field=models.ForeignKey(blank=True, help_text='default background color', max_length=1024, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='background_default', to='hubs.hubthemecolor', verbose_name='default background color'),
        ),
        migrations.AddField(
            model_name='hubtheme',
            name='background_paper',
            field=models.ForeignKey(blank=True, help_text='paper background color', max_length=1024, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='background_paper', to='hubs.hubthemecolor', verbose_name='paper background color'),
        ),
    ]
