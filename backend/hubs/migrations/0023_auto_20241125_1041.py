# Generated by Django 3.2.23 on 2024-11-25 10:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('hubs', '0022_auto_20241125_1014'),
    ]

    operations = [
        migrations.AlterField(
            model_name='hubthemecolor',
            name='extraLight',
            field=models.CharField(blank=True, help_text='extraLight color', max_length=200, null=True, verbose_name='extraLight color'),
        ),
        migrations.AlterField(
            model_name='hubthemecolor',
            name='light',
            field=models.CharField(blank=True, help_text='light color', max_length=200, null=True, verbose_name='light color'),
        ),
        migrations.AlterField(
            model_name='hubthemecolor',
            name='lightHover',
            field=models.CharField(blank=True, help_text='lightHover color', max_length=200, null=True, verbose_name='lightHover color'),
        ),
        migrations.AlterField(
            model_name='hubthemecolor',
            name='main',
            field=models.CharField(blank=True, help_text='main color', max_length=200, null=True, verbose_name='main color'),
        ),
    ]
