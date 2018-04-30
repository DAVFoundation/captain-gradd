const {
  getVehicle: apiGetVehicle,
  addNewVehicle: apiAddNewVehicle,
  updateVehicle: apiUpdateVehicle
} = require('./missioncontrol/vehicles');
const { DavSDK, API } = require('dav-js');
const Rx = require('rxjs/Rx');
const stationId = require('./station-id');
const mnemonic = require('../mnemonic');

class Gradd {
  constructor() {
  }

  async init() {
    this.station = {
      sdk:new DavSDK(stationId, stationId, mnemonic),
      location: {
        longitude: 8.5444809,
        latitude: 47.397669
      },
      needs: [],
      bids: []
    }
    
    let isRegistered = await this.station.sdk.isRegistered();
    if (isRegistered) {
      let missionContract = this.station.sdk.mission().contract();
      missionContract.subscribe(
        mission => this.onContractCreated(this.station, mission),
        err => console.log(err),
        () => console.log('')
      );
    }
    const droneDelivery = this.station.sdk.needs().forType('route_plan', {
      ...this.station.location,
      radius: 10e10,
      ttl: 120 // TTL in seconds
    });

    droneDelivery.subscribe(
      need => this.onNeed(this.station, need),
      err => console.log(err),
      () => console.log('')
    );
  }

  async dispose() {
  }

  async beginMission(vehicleId, missionId) {
    const missionUpdates = Rx.Observable.timer(0, 1000)
      .mergeMap(async () => {
        let mission = await API.missions.getMission(missionId);
        let vehicle = await apiGetVehicle(mission.vehicle_id);
        return { mission, vehicle };
      })
      .distinctUntilChanged(
        (state1, state2) =>
          state1.mission.status === state2.mission.status &&
          state1.vehicle.status === state2.vehicle.status
      )
      .subscribe(
        async state => {
          try {
            switch (state.mission.status) {
              case 'awaiting_signatures':
                break;
              case 'in_progress':
                await this.onInProgress(
                  state.mission,
                  state.vehicle
                );
                break;
              case 'in_mission':
                await this.onInMission(
                  state.mission,
                  state.vehicle
                );
                break;
              case 'completed':
                missionUpdates.unsubscribe();
                break;
              default:
                console.log(`bad mission.status ${state.mission}`);
                break;
            }
          } catch (error) {
            console.error(error);
          }
        },
        error => {
          console.error(error);
        }
      );
  }

  async onInProgress(mission, vehicle) {
    await API.missions.updateMission(mission.mission_id, {
      status: 'in_mission'
    });

    await this.onInMission(mission, vehicle);
  }

  async onInMission(mission, vehicle) {
    // await apiUpdateVehicle(vehicle);

    switch (vehicle.status) {
      case 'contract_received':
        setTimeout(async () => {
          await this.updateStatus(mission, 'takeoff_start', 'takeoff_start');
        }, 3000);
        break;
      case 'takeoff_start':
        setTimeout(async () => {
          await this.updateStatus(mission, 'travelling_pickup', 'travelling_pickup');
        }, 3000);
        break;
      case 'travelling_pickup':
        setTimeout(async () => {
          await this.updateStatus(mission, 'landing_pickup', 'landing_pickup');
        }, 3000);
        break;
      case 'landing_pickup':
        setTimeout(async () => {
          await this.updateStatus(mission, 'waiting_pickup', 'waiting_pickup');
        }, 3000);
        break;
      case 'waiting_pickup':
        console.log(`drone waiting for pickup`);
        break;
      case 'takeoff_pickup':
        setTimeout(async () => {
          await this.updateStatus(mission, 'takeoff_pickup_wait', 'takeoff_pickup_wait');
        }, 3000);
        break;
      case 'takeoff_pickup_wait':
        setTimeout(async () => {
          await this.updateStatus( mission, 'travelling_dropoff', 'travelling_dropoff' );
        }, 3000);
        break;
      case 'travelling_dropoff':
        setTimeout(async () => {
          await this.updateStatus(mission, 'landing_dropoff', 'landing_dropoff');
        }, 3000);
        break;
      case 'landing_dropoff':
        setTimeout(async () => {
          await this.updateStatus(
            mission,
            'waiting_dropoff',
            'waiting_dropoff'
          );
        }, 3000);
        break;
      case 'waiting_dropoff':
        setTimeout(async () => {
          await this.updateStatus(mission, 'completed', 'available');
        }, 3000);
        break;
      case 'available':
        await API.missions.updateMission(mission.mission_id, {
          status: 'completed'
        });
        break;
      default:
        console.log(`bad vehicle.status ${vehicle}`);
        break;
    }
  }

  async updateStatus(mission, missionStatus, vehicleStatus) {
    await API.missions.updateMission(mission.mission_id, {
      mission_status: missionStatus,
      vehicle_status: vehicleStatus,
      // mission_status: { [missionStatus + '_at']: Date.now() }
    });
  }

  /* async updateVehicle(drone) {
    drone.davId = DRONE_ID_MAP[drone.id].address;
    this.addDrone(drone);
    const state = await this.droneApi.getState(drone.id);
    console.log(`${JSON.stringify(state.location)} ${state.status}`);

    let vehicle = await apiGetVehicle(drone.davId);
    if (vehicle) {
      vehicle.coords = {
        long: state.location.lon,
        lat: state.location.lat
      };
      apiUpdateVehicle(vehicle);
    } else {
      let vehicle = {
        id: drone.davId,
        model: 'CopterExpress-d1',
        icon: `https://lorempixel.com/100/100/abstract/?${drone.davId}`,
        coords: {
          long: state.location.lon,
          lat: state.location.lat
        },
        missions_completed: 0,
        missions_completed_7_days: 0,
        status: 'available'
      };
      apiAddNewVehicle(vehicle);
    }
  } */

  /* getBid(davId, origin, pickup, dropoff) {
    dropoff = {
      lat: parseFloat(dropoff.lat),
      long: parseFloat(dropoff.long)
    };
    const distToPickup = geolib.getDistance(
      { latitude: origin.lat, longitude: origin.long },
      { latitude: pickup.lat, longitude: pickup.long },
      1,
      1
    );

    const distToDropoff = geolib.getDistance(
      { latitude: pickup.lat, longitude: pickup.long },
      { latitude: dropoff.lat, longitude: dropoff.long },
      1,
      1
    );

    const totalDist = distToPickup + distToDropoff;

    const bidInfo = {
      price: `${totalDist / DRONE_PRICE_RATE}`,
      price_type: 'flat',
      price_description: 'Flat fee',
      time_to_pickup: distToPickup / DRONE_AVG_VELOCITY + 1,
      time_to_dropoff: distToDropoff / DRONE_AVG_VELOCITY + 1,
      drone_manufacturer: 'Copter Express',
      drone_model: 'SITL',
      expires_at: Date.now() + 3600000,
      ttl: 120 // TTL in seconds
    };

    return bidInfo;
  } */

  async onNeed(station, need) {
    if (station.needs.includes(need.id)) {
      return;
    }
    
    const bidInfo = {
      price: '5000',
      price_type: 'flat',
      price_description: 'Flat fee',
      // time_to_pickup: (distToPickup / DRONE_AVG_VELOCITY) + 1,
      // time_to_dropoff: (distToDropoff / DRONE_AVG_VELOCITY) + 1,
      // drone_manufacturer: 'Copter Express',
      // drone_model: 'SITL',
      ttl: 120 // TTL in seconds
    };

    console.log(`created bid ${need.id}`);
    const bid = station.sdk.bid().forNeed(need.id, bidInfo);
    bid.subscribe(
      (bid) => this.onBidAccepted(station, bid),
      () => console.log('Bid completed'),
      err => console.log(err)
    );
  }

  onBidAccepted(station, bid) {
    if (station.bids.includes(bid.id)) {
      return;
    }
    station.bids.push(bid.id);
  }

  onContractCreated(drone, mission) {
    this.beginMission(mission.vehicle_id, mission.mission_id);
  }
}

module.exports = new Gradd();
