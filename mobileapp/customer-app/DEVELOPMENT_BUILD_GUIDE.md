# Development Build Guide

This guide explains how to use Expo Development Builds to develop with an app that matches your production build.

## Why Development Builds?

- **Consistent behavior**: Matches production build exactly
- **Native modules**: Supports all custom native code
- **Hot reload**: Fast refresh during development
- **Real device testing**: Test on actual devices
- **Build once**: No need to rebuild repeatedly

## Setup (One-time only)

### 1. Login to EAS

```bash
eas login
```

### 2. Build Development Client (Build once!)

#### For Android:
```bash
npm run build:dev:android
```

#### For iOS:
```bash
npm run build:dev:ios
```

This will take 15-20 minutes the first time, but you only do this ONCE!

### 3. Install the Development Client

After the build completes, EAS will provide a link to download the APK/IPA file. Install it on your device.

## Daily Development Workflow

### 1. Start the Development Server

```bash
npm run start:dev
# or
expo start --dev-client
```

### 2. Scan QR Code or Open App

- Open the development client app on your device
- Scan the QR code or press 's' to open in simulator

### 3. Develop with Confidence!

Your app will behave exactly like the production build. No surprises!

## Key Differences from Expo Go

| Feature | Expo Go | Development Build |
|---------|---------|-------------------|
| Matches production | ❌ | ✅ |
| Custom native modules | ❌ | ✅ |
| Fast refresh | ✅ | ✅ |
| Build time | 0 (instant) | 20 min (once) |
| Rebuild needed | Never | Only once |

## When to Build Production

Only build a production version when:
- Your development is complete
- All features are tested
- Ready to release

```bash
npm run build:prod
```

## Troubleshooting

### If the development client gets out of sync:

Just rebuild once:
```bash
npm run build:dev:android
# or
npm run build:dev:ios
```

### If changes aren't reflecting:

Press `r` in the terminal to reload, or shake your device and select "Reload"

## Tips

1. **One device rule**: Build the development client once for your main device
2. **Use preview builds**: For testing across multiple devices, use `eas build --profile preview`
3. **Keep it updated**: Only rebuild the dev client when you add new native dependencies

