# Agent UUIDs — PMS Mission Control
# Org ID: 9c52b861-abb7-4774-9b5b-3fa55c8392cb
# Use these in push-event.ps1 -AgentId parameter

| Name           | Role                    | UUID                                   |
|----------------|-------------------------|----------------------------------------|
| Ziko           | Main Assistant          | a2776ed4-b6a6-4465-b060-664d3a99be55  |
| Nabil          | Supreme Commander       | d9cb258c-c033-4188-998a-a79033e1aa1c  |
| Omar           | Tech Lead (CTO)         | 42ebb10b-2c89-492a-b1f5-120575e5a36d  |
| Karim          | Marketing Lead (CMO)    | 15257503-eba5-4312-8a02-636117e567a2  |
| Design Lead    | Head of Design          | cabaaa15-1678-4978-a375-d16a0545f905  |
| Product Analyst| Product Hub             | b9d6d5c5-e2f9-42cb-ab30-ffabfeaebab0  |
| Sara           | Frontend Engineer       | 8b7f3648-10f8-47c1-a01c-c2e6b3337ea1  |
| Mostafa        | Backend Engineer        | 8b403bd5-a1d2-40d0-834b-33d53da8a978  |
| Ali            | DevOps Engineer         | 1c179c11-317a-4912-891e-d763a22ff57c  |
| Yasser         | Security Engineer       | 502a24e4-d6ff-4905-b914-6dbdaefc74f5  |
| Hady           | QA Engineer             | b9f5258e-1536-4ae3-ba7f-b9f02e3ffc9b  |
| Farah          | Documentation Engineer  | 99a960a5-5182-4c4e-8ef1-faa6918cd94e  |
| Bassem         | Integration Engineer    | d8f61b6e-0a9e-4168-9d38-c942b37feafd  |
| Design Agent   | UI/UX Designer          | 6609eb78-9b6b-4187-a912-01b3b93e3fbf  |
| Sami           | SEO Specialist          | 937c9018-7268-440c-9eb4-ffa3cdddbfad  |
| Maya           | Content Writer          | 656ffc91-7aa6-4858-869f-be770d55b453  |
| Nour           | Social Media Manager    | 6fb40ebe-8242-4b74-a164-838bfbb80ab4  |
| Salma          | Outreach Specialist     | f591e646-458b-4a8d-841c-398fc9449786  |
| Amir           | CRO Specialist          | 85de09d7-5dcc-4501-acb1-3cae2b45917a  |
| Ziad           | Paid Ads Manager        | 024e41d4-433c-4d9f-b315-f4f9123046f2  |
| Mariam         | Email Marketing         | e1492ba6-2475-44ab-9b51-bbedeaca0fb0  |
| Rami           | Growth Analyst          | ed1bdae9-5eb5-4175-8e69-14d04aed20e1  |
| Tarek          | Brand Strategist        | 717e0721-b11c-49ea-b412-747da9ad261f  |
| Researcher     | Research Analyst        | 9d57f0e4-1d36-402a-b752-02dc96a793d3  |

## Event Push Protocol

Push events using:
```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\Fares\.openclaw\workspace\scripts\push-event.ps1" `
  -EventType "<type>" `
  -Message "<message>" `
  -AgentId "<your-uuid>" `
  -TaskId "<task-uuid-if-applicable>"
```

## When to Push

| Moment | EventType |
|--------|-----------|
| You start working on something | task_started |
| Meaningful progress checkpoint | task_progress |
| Task fully complete | task_completed |
| Something failed | task_failed |
| You have info to share / report ready | agent_message |
| You need human approval | approval_request |
| Your status changes (idle→active etc) | status_change |
