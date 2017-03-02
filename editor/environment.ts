import { Utilities } from '@microsoft/office-js-helpers';
import { settings } from './app/helpers';
declare let PLAYGROUND;

let { devMode, build, config } = PLAYGROUND;

class Environment {
    private _config: IEnvironmentConfig;

    constructor() {
        if (devMode) {
            this._config = config['local'];
        }
        else {
            let {origin} = location;
            if (/insiders/.test(origin)) {
                this._config = config['insiders'];
            }
            else if (/edge/.test(origin)) {
                this._config = config['edge'];
            }
            else {
                this._config = config['production'];
            }
        }
    }

    private _current: IEnvironment;
    get current(): IEnvironment {
        if (this._current == null) {
            let environment = settings.cache.get('environment') as IEnvironment;
            if (environment) {
                this.current = { host: environment.host, platform: environment.platform };
            }
            else {
                this.current = {
                    devMode,
                    build,
                    config: this._config
                };
            }
        }

        return this._current;
    }

    set current(value: IEnvironment) {
        let updatedEnv = { ...this._current, ...value };
        this._current = settings.cache.insert('environment', updatedEnv);
    }

    async determineHost() {
        let {host, platform} = await new Promise<{ host: string, platform: string }>(resolve => {
            if (window.location.href.toLowerCase().indexOf('?mode=web') > 0) {
                return resolve({ host: 'WEB', platform: null });
            }
            else {
                let hostButtonsTimeout = setTimeout(() => {
                    $('#hosts').show();
                    $('.ms-progress-component__footer').hide();
                    $('.hostButton').click(function hostButtonClick() {
                        resolve({ host: $(this).data('host'), platform: null });
                    });
                }, 3000);

                Office.initialize = () => {
                    clearTimeout(hostButtonsTimeout);
                    let {host, platform} = Utilities;
                    return resolve({ host, platform });
                };
            }
        });

        this.current = { host, platform };
        return this.current;
    }
}

export const environment = new Environment();