import { NextRequest, NextResponse } from 'next/server';
import { checkForUpdates, getCurrentVersion, isProduction } from '@/lib/version';

/**
 * GET /api/update
 * Check for available updates
 * Only returns update info in production mode
 */
export async function GET(request: NextRequest) {
  try {
    const updateInfo = await checkForUpdates();

    // Add cache headers to prevent excessive API calls
    return NextResponse.json(updateInfo, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Error checking for updates:', error);
    return NextResponse.json(
      {
        error: 'Failed to check for updates',
        hasUpdate: false,
        currentVersion: getCurrentVersion(),
        latestVersion: getCurrentVersion(),
        updateUrl: 'https://github.com/raynaythegreat/Poseidon',
        isDev: !isProduction(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/update
 * Provides update instructions
 * Returns platform-specific update instructions
 */
export async function POST(request: NextRequest) {
  // Only allow updates in production mode
  if (!isProduction()) {
    return NextResponse.json(
      {
        error: 'Updates are disabled in development mode',
        isDev: true,
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { platform } = body;

    // Detect platform from user agent if not provided
    const userAgent = request.headers.get('user-agent') || '';
    let detectedPlatform = 'unknown';

    if (userAgent.includes('Win')) {
      detectedPlatform = 'windows';
    } else if (userAgent.includes('Mac')) {
      detectedPlatform = 'macos';
    } else if (userAgent.includes('Linux')) {
      detectedPlatform = 'linux';
    }

    const updatePlatform = platform || detectedPlatform;

    // Return update instructions based on platform
    const instructions = {
      windows: {
        method: 'Download',
        instructions: [
          '1. Download the latest installer from GitHub Releases',
          '2. Run Poseidon-Setup.exe',
          '3. The installer will automatically update your installation',
        ],
        downloadUrl: 'https://github.com/raynaythegreat/Poseidon/releases/latest',
      },
      macos: {
        method: 'Download',
        instructions: [
          '1. Download the latest DMG from GitHub Releases',
          '2. Open the DMG and drag Poseidon to Applications',
          '3. Replace the existing application',
        ],
        downloadUrl: 'https://github.com/raynaythegreat/Poseidon/releases/latest',
      },
      linux: {
        method: 'Script',
        instructions: [
          '1. Run the installer script: curl -fsSL https://raw.githubusercontent.com/raynaythegreat/Poseidon/main/install.sh | bash',
          '2. Or download the AppImage from GitHub Releases',
        ],
        downloadUrl: 'https://github.com/raynaythegreat/Poseidon/releases/latest',
        scriptUrl: 'https://raw.githubusercontent.com/raynaythegreat/Poseidon/main/install.sh',
      },
      unknown: {
        method: 'Manual',
        instructions: [
          '1. Visit GitHub Releases',
          '2. Download the appropriate package for your platform',
          '3. Follow the installation instructions',
        ],
        downloadUrl: 'https://github.com/raynaythegreat/Poseidon/releases/latest',
      },
    };

    return NextResponse.json({
      success: true,
      platform: updatePlatform,
      ...instructions[updatePlatform as keyof typeof instructions] || instructions.unknown,
      message: 'Update instructions provided',
    });
  } catch (error) {
    console.error('Error providing update instructions:', error);
    return NextResponse.json(
      {
        error: 'Failed to provide update instructions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
