# Modera Dental Voice Agent

A voice AI assistant built with LiveKit Agents.

## Prerequisites

- Python >= 3.10, < 3.14
- [uv](https://docs.astral.sh/uv/getting-started/installation/) package manager
- [LiveKit CLI](https://github.com/livekit/livekit-cli)

## Setup

1. **Install uv** (if not already installed):

   ```shell
   # Windows
   powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```

2. **Install LiveKit CLI**:

   ```shell
   winget install LiveKit.LiveKitCLI
   ```

3. **Authenticate with LiveKit Cloud**:

   ```shell
   lk cloud auth
   ```

4. **Generate environment variables**:

   ```shell
   lk app env -w
   ```

   This creates a `.env.local` file with your API credentials.

5. **Install dependencies**:

   ```shell
   uv sync
   ```

6. **Download model files**:
   ```shell
   uv run agent.py download-files
   ```

## Running the Agent

### Console Mode (test in terminal)

```shell
uv run agent.py console
```

### Development Mode (connect to LiveKit playground)

```shell
uv run agent.py dev
```

### Production Mode

```shell
uv run agent.py start
```

## Deploy to LiveKit Cloud

```shell
lk agent create
```
