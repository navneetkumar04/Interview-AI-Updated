/**
 * WebRTC ICE and STUN/TURN Configuration Helper
 * 
 * Rules:
 * - TURN_URL, TURN_USERNAME, and TURN_CREDENTIAL are fully optional.
 * - If their values are 'none', empty, missing (undefined/null), or placeholders,
 *   completely disable TURN configuration and use normal WebRTC/STUN only.
 * - Never attempt to connect to a TURN server using placeholder or invalid values.
 */

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export const DEFAULT_STUN_SERVERS: string[] = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
  'stun:stun2.l.google.com:19302',
  'stun:stun.cloudflare.com:3478',
];

/**
 * Validates whether a value is missing, empty, 'none', or a placeholder string.
 */
export function isValueEmptyOrPlaceholder(val?: string | null): boolean {
  if (val === undefined || val === null) return true;
  const str = String(val).trim();
  if (str === '') return true;

  const lower = str.toLowerCase();
  if (
    lower === 'none' ||
    lower === 'null' ||
    lower === 'undefined' ||
    lower === 'false' ||
    lower === 'disabled' ||
    lower === 'no' ||
    lower === 'n/a'
  ) {
    return true;
  }

  // Common placeholder tokens
  if (
    lower === 'turn_url' ||
    lower === 'my_turn_url' ||
    lower === 'your_turn_url' ||
    lower === 'turn_username' ||
    lower === 'turn_credential' ||
    lower === 'username' ||
    lower === 'password' ||
    lower === 'secret' ||
    lower.includes('placeholder') ||
    lower.includes('example.com') ||
    lower.includes('your-turn-server')
  ) {
    return true;
  }

  return false;
}

/**
 * Checks whether a URL is a valid TURN URI scheme.
 */
export function isValidTurnUrl(url?: string | null): boolean {
  if (isValueEmptyOrPlaceholder(url)) return false;
  const lower = String(url).trim().toLowerCase();
  return lower.startsWith('turn:') || lower.startsWith('turns:');
}

/**
 * Builds the RTCConfiguration iceServers array.
 * If TURN_URL, TURN_USERNAME, or TURN_CREDENTIAL are none, empty, missing, or placeholders,
 * TURN is completely omitted and standard STUN servers are returned.
 */
export function getIceServers(options?: {
  turnUrl?: string | null;
  turnUsername?: string | null;
  turnCredential?: string | null;
}): {
  iceServers: IceServerConfig[];
  turnEnabled: boolean;
  reason?: string;
} {
  const turnUrl = options?.turnUrl !== undefined ? options.turnUrl : process.env.TURN_URL;
  const turnUsername = options?.turnUsername !== undefined ? options.turnUsername : process.env.TURN_USERNAME;
  const turnCredential = options?.turnCredential !== undefined ? options.turnCredential : process.env.TURN_CREDENTIAL;

  const standardStunServers: IceServerConfig[] = [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  ];

  // 1. If TURN_URL is missing, empty, "none", or placeholder -> STUN only
  if (isValueEmptyOrPlaceholder(turnUrl)) {
    return {
      iceServers: standardStunServers,
      turnEnabled: false,
      reason: 'TURN_URL is none, empty, missing, or placeholder. TURN disabled; STUN only.',
    };
  }

  // 2. Validate TURN URI protocol
  if (!isValidTurnUrl(turnUrl)) {
    return {
      iceServers: standardStunServers,
      turnEnabled: false,
      reason: 'TURN_URL does not start with valid turn: or turns: scheme. TURN disabled; STUN only.',
    };
  }

  // 3. If credentials are missing, empty, "none", or placeholder -> STUN only
  if (isValueEmptyOrPlaceholder(turnUsername) || isValueEmptyOrPlaceholder(turnCredential)) {
    return {
      iceServers: standardStunServers,
      turnEnabled: false,
      reason: 'TURN credentials are none, empty, missing, or placeholder. TURN disabled; STUN only.',
    };
  }

  // 4. Fully valid configuration -> include TURN entry alongside STUN
  const cleanUrl = String(turnUrl).trim();
  const cleanUsername = String(turnUsername).trim();
  const cleanCredential = String(turnCredential).trim();

  return {
    iceServers: [
      ...standardStunServers,
      {
        urls: cleanUrl,
        username: cleanUsername,
        credential: cleanCredential,
      },
    ],
    turnEnabled: true,
  };
}
