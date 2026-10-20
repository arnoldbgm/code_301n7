import {
  Avatar,
  Button,
  Card,
  CardContent,
  Separator,
  Form,
  TextField,
  Label,
  Input,
  DateField,
  Table,
  Chip
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { useEffect, useState } from 'react';
import { supabase } from './utils/supabase';

export default function App() {
  const [jugadores, setJugadores] = useState([]);
  const [formulario, setFormulario] = useState({
    nombre: '',
    posicion: '',
    dorsal: '',
  });
  const [fecha, setFecha] = useState(null);

  useEffect(() => {
    async function getJugadores() {
      const { data, error } = await supabase.from('jugadores').select();
      if (data) {
        console.log(data);
        setJugadores(data);
      } else {
        throw new Error(error.message);
      }
    }

    getJugadores();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormulario({
      ...formulario,
      [name]: value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    console.log(formulario);
    console.log(fecha);
    // Aqui viene toda tu logica para insertar la data
    const { data, error } = await supabase.from('jugadores').insert({
      nombre: formulario.nombre,
      posicion: formulario.posicion,
      dorsal: formulario.dorsal,
      fecha_nacimiento: `${fecha.year}-${fecha.month}-${fecha.day}`,
    });
    console.log('Datos guardos exitosamente');
  }

  async function handleDelete(id){
    let {data, error} = await supabase.from('jugadores').delete().eq('id', id)
    
    if(error){
      console.log(error)
      return
    }

  }

  return (
    <div>
      <>
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

        {jugadores.map((jugador) => (
          <Card key={jugador.id} className='w-80 mb-3'>
            <Card.Header>
              <Card.Title>{jugador.nombre}</Card.Title>
            </Card.Header>
            <CardContent>
              Posicion del jugador <b>{jugador.posicion}</b>
            </CardContent>
            <Card.Footer>
              <Avatar>
                <Avatar.Fallback>{jugador.dorsal}</Avatar.Fallback>
              </Avatar>
            </Card.Footer>
          </Card>
        ))}

        <Separator className='mt-2' />
      </>
      <Form className='w-80' onSubmit={handleSubmit}>
        <TextField isRequired name='nombre'>
          <Label>Nombre</Label>
          <Input
            name='nombre'
            placeholder='Nombre del jugador'
            onChange={handleChange}
            value={formulario.nombre}
          />
        </TextField>

        <TextField isRequired name='posicion'>
          <Label>Posicion</Label>
          <Input
            name='posicion'
            placeholder='Posicion del jugador'
            onChange={handleChange}
            value={formulario.posicion}
          />
        </TextField>

        <TextField isRequired name='dorsal'>
          <Label>Dorsal</Label>
          <Input
            name='dorsal'
            placeholder='Dorsal del jugador'
            type='number'
            onChange={handleChange}
            value={formulario.dorsal}
          />
        </TextField>
        <DateField value={fecha} onChange={setFecha}>
          <Label>Fecha de Nacimiento</Label>
          <DateField.Group>
            <DateField.Input>
              {(segment) => <DateField.Segment segment={segment} />}
            </DateField.Input>
          </DateField.Group>
        </DateField>
        <Button type='submit'>Registrar jugador</Button>
      </Form>
      <Separator />
      <Table>
        <Table.ScrollContainer>
          <Table.Content>
            <Table.Header>
              <Table.Column>Nombre</Table.Column>
              <Table.Column>Posicion</Table.Column>
              <Table.Column>Dorsal</Table.Column>
              <Table.Column>Estado</Table.Column>
              <Table.Column>Fecha de Nacimiento</Table.Column>
              <Table.Column>Acciones</Table.Column>
            </Table.Header>
            <Table.Body>
              { jugadores.map((jugador)=> (
                <Table.Row>
                  <Table.Cell>{jugador.nombre}</Table.Cell>
                  <Table.Cell>{jugador.posicion}</Table.Cell>
                  <Table.Cell>{jugador.dorsal}</Table.Cell>
                  <Table.Cell>{jugador.activo 
                                              ? <Chip color='success' variant='primary'>Activo</Chip> 
                                              : <Chip color='danger' variant='primary'>Retirado</Chip>}
                  </Table.Cell>
                  <Table.Cell>{jugador.fecha_nacimiento}</Table.Cell>
                  <Table.Cell>
                    <Button>Editar</Button>
                    <Button 
                    onPress={() => handleDelete(jugador.id)}
                    variant='secondary'>
                      Eliminar
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}
