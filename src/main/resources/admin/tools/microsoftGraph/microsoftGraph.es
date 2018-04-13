import {
    doctype, html, head, body, main, h1, h2, pre, p, style,
    build, access, clone, render
} from 'render-js/src/class.es';


import {graphSvg} from '/lib/microsoftGraph/svg/graph.es';
import {toStr} from '/lib/microsoftGraph/util/toStr.es';


const VIEW = [
    doctype(),
    html({
        _s: {
            boxSizing: 'border-box',
            fontSize: 16
        }
    }, [
        head([]),
        body([
            main([
                h1({
                    _s: {
                        boxSizing: 'border-box'
                    }
                }, [
                    graphSvg({height: 30}),
                    'Microsoft Graph Admin'
                ]),
                h2('com.enonic.app.admintool.microsoft.graph.cfg'),
            ])
        ])
    ])
];
build(VIEW); // Build styling on static content


export function get() {
    const dom = clone(VIEW);

    const ordered = {};
    Object.keys(app.config).sort().forEach((key) => {
        ordered[key] = app.config[key];
    });

    access(dom, 'html.body.main')
        .addContent(pre(toStr(ordered)))
        .addContent([
            h2('Application configuration file syntax example'),
            p('Replace anything marked with <>'),
            pre(`<userStore>.clientId = <clientId>
<userStore>.clientSecret = <clientSecret>

# * * * * * *
# | | | | | |
# | | | | | +-- Year              (range: 1900-3000)
# | | | | +---- Day of the Week   (range: 1-7, 1 standing for Monday)
# | | | +------ Month of the Year (range: 1-12)
# | | +-------- Day of the Month  (range: 1-31)
# | +---------- Hour              (range: 0-23)
# +------------ Minute            (range: 0-59)

# Once every night at 2:00
<userStore>.cron = 0 2 * * * *


<userStore>.delta = false,
<userStore>.host = https =//graph.microsoft.com

<userStore>.mapping.displayName = displayName
<userStore>.mapping.email = userPrincipalName
<userStore>.mapping.name = mailNickname

<userStore>.photo = true

<userStore>.profile.mapping.<scope>.country = country
<userStore>.profile.mapping.<scope>.displayName = displayName
<userStore>.profile.mapping.<scope>.givenName = givenName
<userStore>.profile.mapping.<scope>.mail = mail
<userStore>.profile.mapping.<scope>.mailNickname = mailNickname
<userStore>.profile.mapping.<scope>.onPremisesDomainName = onPremisesDomainName
<userStore>.profile.mapping.<scope>.onPremisesSamAccountName = onPremisesSamAccountName
<userStore>.profile.mapping.<scope>.preferredLanguage = preferredLanguage
<userStore>.profile.mapping.<scope>.surname = surname
<userStore>.profile.mapping.<scope>.userPrincipalName = userPrincipalName

<userStore>.proxyHost = <example.com>
<userStore>.proxyPassword = <whatever>
<userStore>.proxyPort = <port number>
<userStore>.proxyUser = <username>

<userStore>.resources = aboutMe, responsibilities, skills
<userStore>.scope = https://graph.microsoft.com/.default
<userStore>.tokenUrl = https://login.microsoftonline.com/<tenant>/v2.0/oauth/token`.replace(/</g, '&lt;').replace(/>/g, '&gt;')
            )
        ]);

    // Since pageContributions don't work inline it right away.
    access(dom, 'html.head').addContent(
        render(
            style({type: 'text/css'}, render(dom).css.join())
        ).html
    );

    const response = {
        body: render(dom).html,
        contentType: 'text/html; charset=utf-8'/*,
        pageContributions: { // does not work
            headEnd: [

            ]
        },
        postProcess: true // does not work*/
    };
    //log.info(toStr(response));
    return response;
} // export function get
