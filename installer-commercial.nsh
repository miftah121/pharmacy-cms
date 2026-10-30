!macro customInit
  ; Check if already installed marker exists (Legacy check)
  IfFileExists "$APPDATA\pharmaflow-ims\.installed" 0 +3
    MessageBox MB_OK|MB_ICONEXCLAMATION "PharmaFlow IMS has already been installed using this setup file. Please use the installed application or download a fresh installer."
    Quit

  ; For commercial setups, check if already installed via registry
  ReadRegStr $0 HKCU "Software\PharmaFlow\IMS" "CommercialSetupInstalled"
  StrCmp $0 "1" already_installed not_installed
  
  already_installed:
    MessageBox MB_OK|MB_ICONEXCLAMATION "PharmaFlow IMS (Commercial Version) has already been installed on this computer. Each commercial setup can only be installed once."
    Quit
    
  not_installed:
!macroend
