# Generated by Django 2.2.13 on 2020-08-25 08:24

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('climateconnect_api', '0027_skill_key'),
    ]

    operations = [
        migrations.CreateModel(
            name='Feedback',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.EmailField(blank=True, help_text='The email to which we should send the reply', max_length=254, null=True, verbose_name='User Email')),
                ('text', models.TextField(help_text='The text the user wrote', verbose_name='Feedback')),
                ('send_response', models.BooleanField(default=False, help_text='Checks whether we should response to this user', verbose_name='User requested response')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Time when feedback was created', verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Time when feedback was updated', verbose_name='Updated At')),
                ('user', models.ForeignKey(blank=True, help_text='Points to the user who gave the feedback', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='feedback_user', to=settings.AUTH_USER_MODEL, verbose_name='feedback_user')),
            ],
            options={
                'verbose_name': 'Feedback',
                'verbose_name_plural': 'Feedback_Messages',
                'db_table': 'climateconnect_feedback',
                'ordering': ['-id'],
            },
        ),
    ]
