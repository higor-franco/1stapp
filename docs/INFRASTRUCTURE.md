# Infrastructure — Locaweb Start

> ## Ambiente desmobilizado em 05/09/2026
>
> **O `preview` não existe mais.** O projeto foi desligado. A derrubada rodou pelo
> workflow `teardown-preview.yml` (run
> [33971449838](https://github.com/higor-franco/1stapp/actions/runs/33971449838)) e
> destruiu as políticas de snapshot, os dois discos de 20 GB, o NAT estático, as
> regras de firewall, os IPs públicos **191.252.228.18** (web) e **191.252.228.19**
> (banco), as duas VMs, a rede isolada `1stapp-1186807390-preview` e o par de chaves.
>
> **Antes de derrubar, foi feita uma auditoria** para confirmar que nada mais rodava
> ali: só os contêineres do próprio projeto (o app, três versões antigas paradas e o
> `kamal-proxy`), nenhuma tarefa agendada além das do sistema, nenhum serviço fora do
> padrão. O banco registrava **3 sessões em toda a história** — duas em 22/03/2026 e
> uma em 05/09/2026, a visita de despedida — e os 2 sites cadastrados nunca foram
> editados depois de criados.
>
> **Backup feito e conferido**, fora deste repositório (que é público): dump do
> Postgres nos dois formatos, o volume `/data` (vazio — o contêiner não montava
> volume nenhum) e as variáveis de ambiente. As somas de verificação batem entre a VM
> e o disco de destino.
>
> **O que sobrevive:** os snapshots diários já tirados permanecem na conta CloudStack
> (a política é apagada, os snapshots não) e só saem pelo painel da Locaweb; este
> repositório e as imagens no `ghcr.io`; e as chaves de API do Gemini e da Anthropic,
> que continuam válidas.
>
> **Para ressuscitar:** rodar `deploy-preview.yml` com `recover: true` no bloco
> `with:` do job de infra — sem esse sinalizador os discos vêm em branco. Enquanto os
> snapshots existirem, o caminho de volta existe.
>
> **Nota sobre a chave SSH:** em 05/09/2026 ela precisou ser rotacionada
> (`rotate-ssh-key-preview.yml`) porque não havia cópia em disco nenhum — a chave
> vivia apenas no GitHub Secret `SSH_PRIVATE_KEY`, que não pode ser lido de volta.
> Sem acesso SSH não há como ver registros nem consultar o banco, já que as portas de
> serviço das VMs acessórias não são expostas à internet. Fica o aprendizado: **a
> chave local é parte do backup do ambiente**, não um detalhe da máquina de quem
> implantou.

O quadro abaixo descreve o ambiente como ele era.

| Name | Image | Local Port | Env Var | Type |
|------|-------|------------|---------|------|
| db | supabase/postgres:17.6.1.097 | 5432 | DATABASE_URL | backend |
