import type {VercelRequest, VercelResponse} from '@vercel/node'
import type {AxiosError} from 'axios'
import axios from 'axios'

import {dynamicSleep, handleError} from '../src/utils'

export default async function webhooks(request: VercelRequest, response: VercelResponse): Promise<void> {
	if (request.method !== 'POST') {
		response.status(405).send('this route supports POST only!')
		return
	}

	const {apiVersion, id, token, wait, thread_id} = request.query
	const parameters = new URLSearchParams()
	if (wait) {
		parameters.append('wait', String(wait))
	}

	if (thread_id) {
		parameters.append('thread_id', String(thread_id))
	}

	const url = new URL(`https://discord.com/api/${apiVersion || 'v10'}/webhooks/${id}/${token}?${parameters}`).toString()

	const contentType = request.headers['content-type']!.split(';')[0]

	switch (contentType) {
		case 'application/json': {
			try {
				const {body} = request

				await dynamicSleep(`${id}-${token}`)

				axios
					.post(url, body)
					.then(res => {
						response.status(res.status).send(res.data)
					})
					.catch((error: AxiosError) => {
						handleError(error, response)
					})
			} catch (error: any) {
				response
					.status(400)
					.send({error: error.message})
			}

			break
		}

		case 'text/plain': {
			const body: string = request.body.trim().slice(0, 2000).replace("twitter.com","fxtwitter.com").replace("x.com","fxtwitter.com")
			if (body.length === 0) {
				response.status(400).send({error: 'empty body'})
				return
			}

			await dynamicSleep(`${id}-${token}`)

			axios
				.post(url, {content: body})
				.then(res => {
					response.status(res.status).send(res.data)
				})
				.catch((error: AxiosError) => {
					handleError(error, response)
				})
			break
		}

		default: {
			response.status(415).send({error: 'This Content-Type is not supported! Use "application/json" or "text/plain".'})
			break
		}
	}
}
