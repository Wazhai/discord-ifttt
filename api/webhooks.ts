import type {VercelRequest, VercelResponse} from '@vercel/node'
import axios from 'axios'

import {dynamicSleep, handleError} from '../src/utils'

export default async (request: VercelRequest, response: VercelResponse) => {
	if (request.method !== 'POST') {
		response.status(405).send('this route supports POST only!')
		return
	}

	const {id, token, wait, thread_id} = request.query
	const parameters = new URLSearchParams()
	if (wait) {
		parameters.append('wait', `${wait}`)
	}

	if (thread_id) {
		parameters.append('thread_id', `${thread_id}`)
	}

	const url = new URL(`https://discord.com/api/webhooks/${id}/${token}?${parameters}`).toString()

	const contentType = request.headers['content-type'].split(';')[0]

	switch (contentType) {
		case 'application/json': {
			try {
				const body: Record<string, unknown> = request.body

				await dynamicSleep(`${id}-${token}`)

				axios
					.post(url, body)
					.then(res => {
						response.status(res.status).send(res.data)
					})
					.catch(error => {
						handleError(error, response)
					})
			} catch (error) {
				response
					.status(400)
					.send({error: error.message})
			}

			break
		}

		case 'text/plain': {
			const body: string = request.body.trim().slice(0, 2000)
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
				.catch(error => {
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
