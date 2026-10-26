import { handleApiRequest } from '../server/index.mjs';

export default function characters(request, response) {
  return handleApiRequest(request, response);
}
