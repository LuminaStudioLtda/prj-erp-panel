import "dotenv/config";
import pg from "pg";

const email = process.argv[2]?.toLowerCase();
if (!email) {
  console.error("Uso: pnpm db:promote-admin email@exemplo.com");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const result = await client.query(
  "UPDATE public.users SET role = 'ADMIN' WHERE email = $1",
  [email],
);
await client.end();

console.log(
  result.rowCount
    ? `${email} agora é ADMIN.`
    : `Nenhum usuário com o e-mail ${email}. Cadastre-se primeiro em /cadastro.`,
);
