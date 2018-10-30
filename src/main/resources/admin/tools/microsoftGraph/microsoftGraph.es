//──────────────────────────────────────────────────────────────────────────────
// Node modules (resolved and bundled by webpack)
//──────────────────────────────────────────────────────────────────────────────
import {
    doctype, html, head, body, main, h1, h2, ul, li, a, pre, p, style,
    build, access, clone, render
} from 'render-js/dist/class.js';


//──────────────────────────────────────────────────────────────────────────────
// Enonic XP libs (in jar file, resolved runtime)
//──────────────────────────────────────────────────────────────────────────────
//import {serviceUrl as getServiceUrl} from '/lib/xp/portal';


//──────────────────────────────────────────────────────────────────────────────
// App libs (transpiled to /build and resolved runtime)
//──────────────────────────────────────────────────────────────────────────────
import {graphSvg} from '../../../lib/microsoftGraph/svg/graph.es';
import {deepen} from '../../../lib/microsoftGraph/util/deepen.es';
import {sortObject} from '../../../lib/microsoftGraph/util/sortObject.es';
import {toStr} from '../../../lib/microsoftGraph/util/toStr.es';


//──────────────────────────────────────────────────────────────────────────────
// Static content
//──────────────────────────────────────────────────────────────────────────────
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
                    '&nbsp;Microsoft Graph Admin'
                ]),
                h2('Services:'),
                ul([
                    li(a({
                        href: null//getServiceUrl({service: 'token'}) // TODO Build issue
                    }, 'token'))
                ]),
                h2('com.enonic.app.admintool.microsoft.graph.cfg'),
            ])
        ])
    ])
];
build(VIEW); // Build styling on static content


const EXAMPLE = [
    h2('Application configuration file syntax example'),
    p('Replace anything marked with <>'),
    pre(`<userStore>.client.id = <clientId>
<userStore>.client.secret = <clientSecret>

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

# No scope:
<userStore>.profile.mapping.key = value

# Various scopes:
<userStore>.profile.mapping.<scope>.key = value
<userStore>.profile.mapping.<scope>.<nestedscope>.key = value
<userStore>.profile.mapping.<anotherscope>.key = value

# Examples:
<userStore>.profile.mapping.country = country
<userStore>.profile.mapping.displayName = displayName
<userStore>.profile.mapping.givenName = givenName
<userStore>.profile.mapping.mail = mail
<userStore>.profile.mapping.mailNickname = mailNickname
<userStore>.profile.mapping.onPremisesDomainName = onPremisesDomainName
<userStore>.profile.mapping.onPremisesSamAccountName = onPremisesSamAccountName
<userStore>.profile.mapping.preferredLanguage = preferredLanguage
<userStore>.profile.mapping.surname = surname
<userStore>.profile.mapping.userPrincipalName = userPrincipalName

<userStore>.proxy.host = <example.com>
<userStore>.proxy.password = <whatever>
<userStore>.proxy.port = <port number>
<userStore>.proxy.user = <username>

<userStore>.resources = aboutMe, responsibilities, skills
<userStore>.scope = https://graph.microsoft.com/.default
<userStore>.tokenUrl = https://login.microsoftonline.com/<tenant>/v2.0/oauth/token`
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    ) // pre
]; // EXAMPLE


//──────────────────────────────────────────────────────────────────────────────
// Dynamic content
//──────────────────────────────────────────────────────────────────────────────
export function get() {
    const dom = clone(VIEW);

    /*const ordered = {};
    Object.keys(app.config).sort().forEach((key) => {
        ordered[key] = app.config[key];
    });*/

    access(dom, 'html.body.main')
        .addContent(pre(toStr(sortObject(deepen(app.config)))))
        .addContent(EXAMPLE);

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
