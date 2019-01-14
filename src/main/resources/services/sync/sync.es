//──────────────────────────────────────────────────────────────────────────────
// Enonic XP libs (in jar file, resolved runtime)
//──────────────────────────────────────────────────────────────────────────────
import {toStr} from '/lib/enonic/util';
import {
	get as getTask,
	//isRunning as getIsRunning,
	list,
	submitNamed
} from '/lib/xp/task';

//──────────────────────────────────────────────────────────────────────────────
// App libs (transpiled to /build and resolved runtime)
//──────────────────────────────────────────────────────────────────────────────
import getIsMaster from '../../lib/microsoftGraph/cluster/isMaster.es';
import {jsonError} from '../../lib/microsoftGraph/util/jsonError.es';
import {htmlResponse} from '../../lib/microsoftGraph/web/htmlResponse.es';


const TASK_NAME = `${app.name}:sync`;


function runningId(name) {
	//const isRunning = getIsRunning(name);
	//log.info(toStr({isRunning}));
	const runningTasks = list({
		name,
		state: 'RUNNING'
	});
	//log.info(toStr({runningTasks}));
	return runningTasks.length ? runningTasks[0].id : false;
}

const Label = ({children, label}) => `<label>
	<span>${label}</span>
	${children}
</label>`;


const Input = ({
	name,
	placeholder,
	type = 'text',
	value,
	...rest
} = {}) => `<input
	name="${name}"
	type="${type}"
	placeholder="${placeholder}"
	value="${value}"
	${Object.keys(rest).map(k => `${k}="${rest[k]}"`).join(' ')}
/>`;

const userStoreInput = ({
	placeholder = 'graph',
	value = ''
} = {}) => Label({
	children: Input({name: 'userStore', placeholder, value}),
	label: 'Userstore'
});


const missingUserStoreParamResponse = htmlResponse({
	main: `<form>${userStoreInput()}<button type="submit">Submit</button</form>`,
	messages: ['Url parameter userStore must be present!'],
	status: 400,
	title: 'Sync service'
});


//──────────────────────────────────────────────────────────────────────────────
// Exported functions
//──────────────────────────────────────────────────────────────────────────────
export function get({
	params: { userStore }
} = {}, {
	isMaster = getIsMaster(),
	taskId = runningId(TASK_NAME)
} = {}) {
	if (!isMaster) {
		return jsonError('You are only allowed to run this server on the active master node.');
	}

	if (!userStore) { return missingUserStoreParamResponse; }

	const task = getTask(taskId);
	const sampInnerHtml = JSON.stringify(task, null, 4)
		.replace(/ /g, '&nbsp;')
		.replace(/\n/g, '<br />');

	return htmlResponse({
		main: `<form>
	${userStoreInput({value: userStore})}
	<button formmethod="get">Status</button>
	<button formmethod="post">Start</button>
</form><samp>${sampInnerHtml}</samp>`,
		title: `Sync userStore ${userStore}`
	});
} // get


export const post = ({
	params: { userStore }
}) => {
	const isMaster = getIsMaster();
	if (!isMaster) {
		return jsonError('You are only allowed to run this server on the active master node.');
	}

	if (!userStore) { return missingUserStoreParamResponse; }
	const taskId = runningId(TASK_NAME) || submitNamed({
		name: TASK_NAME,
		config: {
			userStore
		}
	});
	return get({
		params: { userStore }
	}, {
		isMaster,
		taskId
	});
}; // post
