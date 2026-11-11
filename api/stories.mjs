import { handleApiRequest } from '../server/index.mjs';

export default function stories(request, response) {
  return handleApiRequest(request, response);
}
