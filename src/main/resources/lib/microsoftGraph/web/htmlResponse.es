export const htmlResponse = ({
	main = '',
	messages = [],
	status,
	title
} = {}) => ({
	body: `<html>
	<head>
		<title>${title}</title>
		<style type="text/css">
			::placeholder {
				color: #dddddd;
			}
			.error {
				color: red;
			}
		</style>
	</head>
	<body>
		<header>
			${messages.length
		? `<ul class="${status === 200 ? '' : 'error'}">
	${messages.map(m => `<li>${m}</li>`)}
</ul>`
		: ''}
		</header>
		<main>${main}</main>
	</body>
</html>`,
	contentType: 'text/html;charset=utf-8',
	status
});
