$agents = @('ziko','nabil','omar','karim','design-lead','product-analyst','researcher','sara','mostafa','ali','yasser','hady','farah','bassem','design-agent','sami','maya','amir','rami','tarek','mariam','nour','salma','ziad')
$dir = "C:\Users\Fares\.openclaw\workspace\agents\working\"

foreach ($a in $agents) {
    $lines = @(
        "# WORKING.md - $a",
        "",
        "## Current Task",
        "(none)",
        "",
        "## Status",
        "Idle",
        "",
        "## Next Steps",
        "(none)",
        "",
        "## Last Updated",
        "2026-02-24"
    )
    $content = $lines -join "`n"
    Set-Content -Path "$dir$a.md" -Value $content -Encoding UTF8
    Write-Host "Created $a.md"
}
Write-Host "Done."
