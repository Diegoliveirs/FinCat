# CI/CD: PostgreSQL, staging e produção blue-green

Este repositório publica duas imagens por commit de `develop`: a aplicação e o executor de migrations. Ambas recebem a SHA do commit. O deploy resolve essa tag para o digest retornado pelo GHCR antes de iniciar qualquer container; portanto, staging e produção executam uma imagem imutável, sem `latest` e sem rebuild na EC2.

## Fluxo

1. Um PR para `develop` ou `main` executa formatador, TypeScript, testes, migration e build em PostgreSQL efêmero.
2. Um merge em `develop` publica `ghcr.io/diegoliveirs/fincat:<sha>` e `ghcr.io/diegoliveirs/fincat-migrations:<sha>`, então o runner da EC2 executa o deploy de staging.
3. Um PR de `develop` para `main`, aprovado e mergeado, promove as mesmas tags SHA para produção. O Environment `production` deve exigir aprovação manual antes do job começar.
4. Produção executa migrations, sobe a cor inativa, espera `GET /api/health`, troca o upstream do Nginx e valida o domínio público. A cor anterior só é parada depois disso.

As migrations devem ser sempre **expand/contract**: primeiro adicionar estruturas compatíveis com a imagem antiga e a nova; remover colunas ou comportamentos antigos somente em uma entrega posterior. O rollback de imagem não desfaz migrations.

## Preparação inicial da EC2

Instale Docker Compose, Nginx, Certbot, `apache2-utils` e um runner self-hosted do GitHub. A máquina precisa de Docker autenticado para ler o pacote privado do GHCR (`read:packages`). O token e todos os arquivos abaixo ficam apenas na EC2, com permissão `600`.

Crie a rede compartilhada e os diretórios protegidos:

```bash
docker network create fincat
sudo install -d -o <runner-user> -g <runner-user> -m 700 /opt/fincat/deploy/state /opt/fincat/staging /opt/fincat/prod
sudo install -o <runner-user> -g <runner-user> -m 600 /dev/null /opt/fincat/deploy/.env.postgres
sudo install -o <runner-user> -g <runner-user> -m 600 /dev/null /opt/fincat/staging/.env.staging.local
sudo install -o <runner-user> -g <runner-user> -m 600 /dev/null /opt/fincat/prod/.env.production.local
```

Copie os modelos em `infra/.env.infrastructure.example`, `infra/.env.staging.example` e `infra/.env.production.example` para esses caminhos e substitua todos os valores. Use senhas, segredos Better Auth e a conta dona diferentes em staging e produção. Os `DATABASE_URL` usam o hostname interno `postgres`; a porta do PostgreSQL não é publicada no host.

Suba e provisione PostgreSQL uma única vez:

```bash
docker compose --env-file /opt/fincat/deploy/.env.postgres -f infra/compose.postgres.yaml up -d
bash ./infra/bin/provision-postgres /opt/fincat/deploy/.env.postgres
```

O provisionamento cria os bancos `fincat_staging` e `fincat_prod` e usuários distintos. O primeiro deploy executa a migration e cria a conta dona definida no respectivo arquivo de ambiente. Como os dados atuais podem ser descartados, pare e remova antes o container/volume SQLite legado para liberar a porta `127.0.0.1:3000`.

## Nginx, TLS e Basic Auth

Instale `infra/nginx/fincat-upstream.conf` em `/etc/nginx/conf.d/fincat-upstream.conf` e `infra/nginx/fincat.conf` em `/etc/nginx/sites-available/fincat.conf`; habilite o site. Gere os certificados para os dois domínios antes de validar a configuração.

```bash
sudo htpasswd -c /etc/nginx/fincat-staging.htpasswd seu_usuario_de_staging
sudo nginx -t && sudo systemctl reload nginx
```

O arquivo de upstream é alterado somente pelo deploy de produção. Autorize o usuário do runner apenas a executar sem senha `nginx -t`, `systemctl reload nginx`, `install` e a leitura/escrita desse arquivo; não conceda acesso sudo irrestrito.

## GitHub

Em **Settings → Branches**, proteja `develop` e `main`: PR obrigatório, pelo menos uma aprovação, checks obrigatórios (`CI / verify`), branch atualizada antes do merge e sem push direto/force push.

Em **Settings → Environments**, crie `staging` e `production`; em `production`, configure revisores obrigatórios. Registre o runner na EC2 com a label `fincat-deploy`. Ele só é usado pelos workflows de deploy de branches protegidas; PRs executam no GitHub-hosted runner.

Os workflows têm concorrência por ambiente, por isso dois deploys do mesmo ambiente não se sobrepõem.

## Operação e rollback

Para confirmar a versão de staging ou produção, use `docker ps --format '{{.Image}} {{.Names}}'` e `docker image inspect` para verificar o digest. Staging usa `127.0.0.1:3001`; produção usa azul em `3000` ou verde em `3002`, nunca expostos publicamente.

Se o healthcheck da cor nova falhar, o script encerra sem alterar o Nginx. Se a validação externa falhar após a troca, o script restaura o upstream anterior. Para rollback de uma versão já saudável, reexecute o deploy com a SHA anterior compatível; não altere o banco.
