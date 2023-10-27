use bevy::prelude::*;
use bevy_flycam::{FlyCam, NoCameraPlayerPlugin};
use dojo::{DojoPlugin, DojoResource};
use starknet::macros::felt;
use std::collections::HashMap;

mod dojo;

#[derive(Clone, Eq, PartialEq, Debug, Hash, Default, States)]
enum GameState {
    #[default]
    Playing,
    GameOver,
}

fn main() {
    App::new()
        .add_plugins((
            DefaultPlugins,
            NoCameraPlayerPlugin,
            DojoPlugin::new(
                "http://0.0.0.0:5050/".into(),
                "http://0.0.0.0:8080/".into(),
                felt!("0x1ced4b9d69e6fe907fea23bea7e27b287ad3589c62659ccc0d78d435ba906f5"),
                felt!("0x517ececd29116499f4a1b64b094da79ba08dfd54a3edaa316134c41f8160973"),
                felt!("0x1800000000300000180000000000030000000000003006001800006600"),
            ),
        ))
        .init_resource::<Game>()
        .add_state::<GameState>()
        .add_systems(Startup, setup_cameras)
        .add_systems(OnEnter(GameState::Playing), setup)
        .add_systems(OnExit(GameState::Playing), teardown)
        .add_systems(
            Update,
            (
                gameover_keyboard.run_if(in_state(GameState::GameOver)),
                bevy::window::close_on_esc,
            ),
        )
        .add_systems(OnExit(GameState::GameOver), teardown)
        .run();
}

#[derive(Default)]
struct Player {
    entity: Option<Entity>,
}

#[derive(Component)]
struct Hex {
    owner: u8,
}

#[derive(Resource, Default)]
struct Game {
    id: u64,
    player: Vec<Player>,

    camera_should_focus: Vec3,
    camera_is_focus: Vec3,
}

#[derive(Resource, Default)]
struct Board {
    hexs: HashMap<(u8, u8), Hex>,
}

const HEX_HEIGHT: f32 = 1.73;
const HEX_WIDTH: f32 = 2.0;

// const BOARD_HEIGHT: usize = 5 * HEX_HEIGHT;
// const BOARD_WIDTH: usize = 5 * HEX_WIDTH;

const RESET_FOCUS: [f32; 3] = [5. * HEX_HEIGHT / 2.0, 0.0, 5. * HEX_WIDTH / 2.0 - 0.5];

fn setup_cameras(mut commands: Commands, mut game: ResMut<Game>) {
    game.camera_should_focus = Vec3::from(RESET_FOCUS);
    game.camera_is_focus = game.camera_should_focus;

    commands.spawn((
        Camera3dBundle {
            transform: Transform::from_xyz(
                -(5. * HEX_HEIGHT as f32 / 2.0),
                2.0 * 5. * HEX_WIDTH as f32 / 3.0,
                5. * HEX_WIDTH as f32 / 2.0 - 0.5,
            )
            .looking_at(game.camera_is_focus, Vec3::Y),
            ..default()
        },
        FlyCam,
    ));
}

fn setup(
    mut commands: Commands,
    dojo: Res<DojoResource>,
    asset_server: Res<AssetServer>,
    mut game: ResMut<Game>,
) {
    commands.spawn(PointLightBundle {
        transform: Transform::from_xyz(4.0, 10.0, 4.0),
        point_light: PointLight {
            intensity: 3000.0,
            shadows_enabled: true,
            range: 30.0,
            ..default()
        },
        ..default()
    });

    // spawn the game board
    let cell_scene = asset_server.load("tile_hexagon.glb#Scene0");
    let z_offset = (3. / 4.) * HEX_WIDTH;

    for i in 0..16_u8 {
        for j in 0..16_u8 {
            let offset = if i % 2 == 0 { 0.0 } else { HEX_HEIGHT / 2.0 };
            let x = (HEX_HEIGHT * j as f32) + offset;
            let z = z_offset * i as f32;
            let transform = Transform::from_xyz(x, 1., z);

            // let value = dojo
            //     .client
            //     .lock()
            //     .entity("Hex", &vec![dojo.game_id, i.into(), j.into()])
            //     .unwrap();

            let _ = commands
                .spawn((
                    SceneBundle {
                        transform,
                        scene: cell_scene.clone(),
                        ..default()
                    },
                    Hex { owner: 0 },
                ))
                .id();
        }
    }
}

// remove all entities that are not a camera or window
fn teardown(mut commands: Commands, entities: Query<Entity, (Without<Camera>, Without<Window>)>) {
    for entity in &entities {
        commands.entity(entity).despawn();
    }
}

// restart the game when pressing spacebar
fn gameover_keyboard(
    mut next_state: ResMut<NextState<GameState>>,
    keyboard_input: Res<Input<KeyCode>>,
) {
    if keyboard_input.just_pressed(KeyCode::Space) {
        next_state.set(GameState::Playing);
    }
}
