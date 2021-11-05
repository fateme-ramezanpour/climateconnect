# Generated by Django 2.2.20 on 2021-09-16 10:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('climateconnect_api', '0060_auto_20210420_1614'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='email_on_mention',
            field=models.BooleanField(blank=True, default=True, help_text='Check if user wants to receive emails when they are mentioned in a comment on a project', null=True, verbose_name='Email on mention'),
        ),
        migrations.AlterField(
            model_name='notification',
            name='notification_type',
            field=models.IntegerField(choices=[(0, 'broadcast'), (1, 'private_message'), (2, 'project_comment'), (3, 'reply_to_project_comment'), (4, 'project_follower'), (5, 'project_update_post'), (6, 'post_comment'), (7, 'reply_to_post_comment'), (8, 'group_message'), (9, 'mention')], default=0, help_text='type of notification', verbose_name='Notification type'),
        ),
    ]