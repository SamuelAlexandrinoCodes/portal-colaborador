import { LogLevel } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    // A inteligência que você forneceu (Ação 1)
    clientId: "46472b44-9df0-4dc5-9d28-3bef6124fd66",
    authority: "https://login.microsoftonline.com/9e7f6939-47fc-4ab0-9851-a8fa3973dcb2",
    
    // O URI de Redirecionamento (Ação 2)
    redirectUri: "https://proud-grass-06ef6a70f.3.azurestaticapps.net"
  },
  cache: {
    cacheLocation: "sessionStorage", // 'sessionStorage' é mais seguro
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            // console.info(message); // Descomente para debug
            return;
          case LogLevel.Verbose:
            // console.debug(message); // Descomente para debug
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      },
    },
  },
};

// Escopos necessários para o token
export const loginRequest = {
  scopes: ["User.Read"]
};