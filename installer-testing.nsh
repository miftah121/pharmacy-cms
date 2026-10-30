!macro customInit
  ; Check if already installed marker exists (Legacy check)
  IfFileExists "$APPDATA\pharmaflow-ims\.installed" 0 +3
    MessageBox MB_OK|MB_ICONEXCLAMATION "PharmaFlow IMS has already been installed using this setup file. Please use the installed application or download a fresh installer."
    Quit
!macroend
