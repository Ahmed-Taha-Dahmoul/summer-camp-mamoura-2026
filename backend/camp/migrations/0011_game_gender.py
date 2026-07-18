import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('camp', '0010_remove_game_instantane_start_date_game_active_since'),
    ]

    operations = [
        migrations.AddField(
            model_name='game',
            name='gender',
            field=models.CharField(choices=[('BOTH', 'Both'), ('BOY', 'Boy Scouts'), ('GIRL', 'Girl Scouts')], default='BOTH', help_text='Which group(s) this game applies to', max_length=4),
        ),
    ]
