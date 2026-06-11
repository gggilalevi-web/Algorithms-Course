@AGENTS.md
## IMPORTANT: Sound Notification

After finishing responding to a request (task done), run this command:

```powershell
(New-Object Media.SoundPlayer 'C:\Windows\Media\ding.wav').PlaySync()
```

When waiting for a response from the user (e.g. asking a question or pausing mid-task), run this command instead:

```powershell
(New-Object Media.SoundPlayer 'C:\Windows\Media\Windows Notify.wav').PlaySync()
```
