'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Content,
  Form,
  ButtonToolbar,
  Button,
  Panel,
  FlexboxGrid,
  Loader,
  IconButton
} from 'rsuite';
import { createBrowserClient } from '@supabase/ssr';
import { Session } from '@supabase/supabase-js';
import OffRoundIcon from '@rsuite/icons/OffRound';
import { useRouter } from 'next/navigation';

// Créer le client Supabase
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function Login() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      router.push("/");
    } catch (err) {
      console.error('Erreur de connexion:', err);
      // Ici vous pourriez ajouter une notification d'erreur
    } finally {
      setEmail('');
      setPassword('');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error('Erreur de déconnexion:', err);
    }
  };

  if (loading) return <Loader center content="loading" />;

  return (
    <Container>
      <Content>
        <FlexboxGrid justify="center" style={{ marginTop: 40 }}>
          <FlexboxGrid.Item colspan={12}>
            {!session ? (
              <Panel header={<h3>Login</h3>} shaded bordered style={{ width: 500, margin: '0 auto'}}>
                <Form fluid>
                  <Form.Group>
                    <Form.ControlLabel>Username or email address</Form.ControlLabel>
                    <Form.Control 
                      name="email" 
                      value={email}
                      onChange={(value) => setEmail(value as string)} 
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.ControlLabel>Password</Form.ControlLabel>
                    <Form.Control 
                      name="password" 
                      type="password" 
                      autoComplete="off"
                      value={password}
                      onChange={(value) => setPassword(value as string)}
                    />
                  </Form.Group>
                  <Form.Group>
                    <ButtonToolbar>
                      <Button appearance="primary" onClick={handleLogin}>Sign in</Button>
                      <Button appearance="link">Forgot password?</Button>
                    </ButtonToolbar>
                  </Form.Group>
                </Form>
              </Panel>
            ) : (
              <>
                <p>Welcome back {session.user.email}</p>
                <IconButton size="sm" onClick={handleLogout} appearance="primary" icon={<OffRoundIcon />}>
                  Logout
                </IconButton>
              </>
            )}
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </Content>
    </Container>
  );
}

export default Login;