/* The only values to change if repos or store listings move. */

export const TEMPLATE_REPO = 'https://github.com/DudeThatsErin/AppleQueue-Backend';
export const EXTENSION_REPO = 'https://github.com/DudeThatsErin/AppleQueue';
export const EXTENSION_RELEASES = `${EXTENSION_REPO}/releases/latest`;
export const SUPPORT_URL = 'https://github.com/DudeThatsErin/applequeuesite/issues';

// The terminal client. Same backend, same API key, no browser.
export const CLI_REPO = 'https://github.com/DudeThatsErin/AppleQueueTerminal';
export const CLI_RELEASES = `${CLI_REPO}/releases/latest`;
export const CLI_ISSUES = `${CLI_REPO}/issues`;
export const CLI_PACKAGE = 'AppleQueueTerminal';
export const CLI_NUGET = `https://www.nuget.org/packages/${CLI_PACKAGE}`;
export const CLI_INSTALL_DOTNET = `dotnet tool install --global ${CLI_PACKAGE}`;
export const CLI_UPDATE_DOTNET = `dotnet tool update --global ${CLI_PACKAGE}`;
export const CLI_UNINSTALL_DOTNET = `dotnet tool uninstall --global ${CLI_PACKAGE}`;
export const CLI_DOTNET_VERSION = '.NET 8';

export const SUPPORT_EMAIL = 'mailto:me@erinskidds.com';

// Set these once each store listing is live. Step 5 of the wizard swaps to
// store buttons and hides the "load unpacked" instructions on its own.
export const CHROME_STORE_URL = '';
export const FIREFOX_ADDON_URL = '';
