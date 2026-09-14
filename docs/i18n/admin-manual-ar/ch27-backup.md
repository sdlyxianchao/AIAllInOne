# الفصل 27: النسخ الاحتياطي والاستعادة

*الجزء الثالث · قسم التشغيل والصيانة*

> نسخ احتياطي بمستويين، التحقق من التكامل، سكريبتات مستقلة.

[← الفصل 26: مستقبل البريد MailHog](ch26-ops-mailhog.md) · [📖 الفهرس](index.md) · [الفصل 28: الفحص الصحي والفحص الذاتي عند الإقلاع →](ch28-healthcheck.md)

---

**الموقع**: `C:\AIAllInOne\Backup\` — سكريبتات PowerShell مستقلة عن مركز إدارة الذكاء الاصطناعي.

| السكريبت | الاستخدام |
| --- | --- |
| `backup-docker.ps1` | النسخ الاحتياطي (مستويان) |
| `restore-docker.ps1` | الاستعادة (استراتيجيتان) |
| `check_backup.ps1` | التحقق من التكامل (5 طبقات) |
| `fix-backup-task.ps1` | إصلاح المهمة المجدولة |

## 27.1 مستويات النسخ الاحتياطي

| المستوى | المحتوى | الاستخدام |
| --- | --- | --- |
| **L1** (افتراضي) | ملفات الإعداد + قواعد البيانات | لقطة يومية |
| **L2** | L1 + `docker_data.vhdx` | استعادة كاملة من الكوارث |

## 27.2 النسخ الاحتياطي اليدوي

```powershell
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 1
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 2
C:\AIAllInOne\Backup\backup-docker.ps1 -Level 2 -DryRun
```

## 27.3 النسخ الاحتياطي المجدول

```powershell
C:\AIAllInOne\Backup\fix-backup-task.ps1 -Apply -BackupRoot "F:\Backup\Docker"
```

## 27.4 الاستعادة

```powershell
C:\AIAllInOne\Backup\restore-docker.ps1 -BackupDir "C:\AIAllInOne\Backup\backups\backup_20260912_020000"
```

## 27.5 التحقق

```powershell
C:\AIAllInOne\Backup\check_backup.ps1 "C:\AIAllInOne\Backup\backups\backup_20260912_020000"
```

## 27.6 نقاط حرجة

> ⚠️
> - يجب استخدام **realm export/import (JSON)** مع Keycloak;
> - L2 يوقف المنصة مؤقتًا;
> - دائمًا تحقق بـ `check_backup.ps1` قبل الاستعادة.

---

[← الفصل 26: مستقبل البريد MailHog](ch26-ops-mailhog.md) · [📖 الفهرس](index.md) · [الفصل 28: الفحص الصحي والفحص الذاتي عند الإقلاع →](ch28-healthcheck.md)
