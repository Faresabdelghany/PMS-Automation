$crons = @(
    @{
        name = "product-analyst-heartbeat"
        cron = "0,15,30,45 * * * *"
        message = "You are the Product Analyst. Read C:\Users\Fares\.openclaw\workspace\agents\prompts\product-analyst.md then your WORKING.md at C:\Users\Fares\.openclaw\workspace\agents\working\product-analyst.md. Poll PMS for pending agent_commands by running: powershell -ExecutionPolicy Bypass -File C:\Users\Fares\.openclaw\workspace\scripts\poll-commands.ps1. If a command is assigned to session agent:product-analyst:main, handle it. Otherwise reply HEARTBEAT_OK."
    },
    @{
        name = "omar-heartbeat"
        cron = "2,17,32,47 * * * *"
        message = "You are Omar, Tech Lead. Read C:\Users\Fares\.openclaw\workspace\agents\prompts\omar.md then your WORKING.md at C:\Users\Fares\.openclaw\workspace\agents\working\omar.md. Poll PMS for pending agent_commands by running: powershell -ExecutionPolicy Bypass -File C:\Users\Fares\.openclaw\workspace\scripts\poll-commands.ps1. If a command is assigned to session agent:tech-lead:main, handle it. Otherwise reply HEARTBEAT_OK."
    },
    @{
        name = "karim-heartbeat"
        cron = "4,19,34,49 * * * *"
        message = "You are Karim, Marketing Lead. Read C:\Users\Fares\.openclaw\workspace\agents\prompts\karim.md then your WORKING.md at C:\Users\Fares\.openclaw\workspace\agents\working\karim.md. Poll PMS for pending agent_commands by running: powershell -ExecutionPolicy Bypass -File C:\Users\Fares\.openclaw\workspace\scripts\poll-commands.ps1. If a command is assigned to session agent:marketing-lead:main, handle it. Otherwise reply HEARTBEAT_OK."
    },
    @{
        name = "design-lead-heartbeat"
        cron = "6,21,36,51 * * * *"
        message = "You are the Design Lead. Read C:\Users\Fares\.openclaw\workspace\agents\prompts\design-lead.md then your WORKING.md at C:\Users\Fares\.openclaw\workspace\agents\working\design-lead.md. Poll PMS for pending agent_commands by running: powershell -ExecutionPolicy Bypass -File C:\Users\Fares\.openclaw\workspace\scripts\poll-commands.ps1. If a command is assigned to session agent:design-lead:main, handle it. Otherwise reply HEARTBEAT_OK."
    }
)

foreach ($c in $crons) {
    Write-Host "Adding cron: $($c.name)..."
    $args = @(
        "cron", "add",
        "--name", $c.name,
        "--cron", $c.cron,
        "--session", "isolated",
        "--message", $c.message,
        "--model", "anthropic/claude-sonnet-4-6",
        "--timeout-seconds", "120"
    )
    & openclaw.cmd @args
    Write-Host "Done: $($c.name)"
}

Write-Host "All crons added."
