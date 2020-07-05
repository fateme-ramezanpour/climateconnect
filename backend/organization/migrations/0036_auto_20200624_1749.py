# Generated by Django 2.2.13 on 2020-06-24 17:49

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('organization', '0035_auto_20200624_1507'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='projecttags',
            options={'ordering': ['id'], 'verbose_name': 'Project Tags'},
        ),
        migrations.AlterField(
            model_name='organizationtags',
            name='parent_tag',
            field=models.ForeignKey(blank=True, help_text='Points to the parent tag', null=True, on_delete=django.db.models.deletion.PROTECT, related_name='organization_tag_parent', to='organization.OrganizationTags', verbose_name='Parent Tag'),
        ),
        migrations.AlterField(
            model_name='projecttags',
            name='parent_tag',
            field=models.ForeignKey(blank=True, help_text='Points to the parent tag', null=True, on_delete=django.db.models.deletion.PROTECT, related_name='project_tag_parent', to='organization.ProjectTags', verbose_name='Parent Tag'),
        ),
    ]
