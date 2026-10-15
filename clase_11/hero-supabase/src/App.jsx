import { Avatar, Button, Card, CardContent, Separator, Form, TextField, Label, Input, DateField } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useEffect, useState } from 'react';
import { supabase } from './utils/supabase';

export default function App() {
  const [jugadores, setJugadores] = useState([]);

  useEffect(() => {
    async function getJugadores() {
      const { data, error } = await supabase.from('jugadores')
                                            .select();
      if (data){
        console.log(data)
        setJugadores(data)
      } else{
        throw new Error(error.message)
      }
    }

    getJugadores()
  }, []);

  return (
    <div>
      <Avatar size='lg' color='success' variant='soft'>
        <Avatar.Fallback>AG</Avatar.Fallback>
      </Avatar>
      <Button variant='danger'>Clickeame soy un boton</Button>
      <Button variant='tertiary'>
        <Icon icon='ion:logo-apple' />
        Sign in with Apple
      </Button>
      <Card className='w-80' variant='secondary'>
        <Card.Header>
          <Card.Title>Titulo de mi card</Card.Title>
          <Card.Description>Descripcion de mi card</Card.Description>
        </Card.Header>
        <Card.Content>Este es el contendio de mi card</Card.Content>
        <Card.Footer>
          <Button>Clickea el card</Button>
        </Card.Footer>
      </Card>
      <Separator className='mt-2' />

      {
        jugadores.map((jugador)=> (
          <Card key={jugador.id} className='w-80 mb-3'>
            <Card.Header>
              <Card.Title>{jugador.nombre}</Card.Title>
            </Card.Header>
            <CardContent>Posicion del jugador <b>{jugador.posicion}</b></CardContent>
            <Card.Footer>
              <Avatar>
                <Avatar.Fallback>{jugador.dorsal}</Avatar.Fallback>
              </Avatar>
            </Card.Footer>
          </Card>
        ))
      }

      <Separator className='mt-2' />

      <Form className='w-80'>
        <TextField isRequired name='nombre'>
          <Label>Nombre</Label>
          <Input placeholder='Nombre del jugador'/>
        </TextField>

        <TextField isRequired name='posicion'>
          <Label>Posicion</Label>
          <Input placeholder='Posicion del jugador' />
        </TextField>

        <TextField isRequired name='dorsal'>
          <Label>Dorsal</Label>
          <Input placeholder='Dorsal del jugador' type='number'/>
        </TextField>

        <DateField>
          <Label>Fecha de Nacimiento</Label>
          <DateField.Group>
            <DateField.Input>
              {(segment) => <DateField.Segment segment={segment} />}
            </DateField.Input>
          </DateField.Group>
        </DateField>
        <Button type="submit">Registrar jugador</Button>
      </Form>
    </div>
  );
}
