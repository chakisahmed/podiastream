' Runs a command with no visible console window, and doesn't wait for it
' to finish. Used by start.bat to launch the backend/frontend silently.
' Usage: cscript //nologo run_hidden.vbs "<command>" "<working directory>"
Set objShell = CreateObject("WScript.Shell")
objShell.CurrentDirectory = WScript.Arguments(1)
objShell.Run WScript.Arguments(0), 0, False
