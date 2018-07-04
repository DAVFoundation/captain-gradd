const { DavSDK } = require('dav-js');
const Rx = require('rxjs/Rx');
const mnemonic = require('../mnemonic');
const graddMailService = require('./graddMailService');


class Gradd {
  constructor() {

  }

  async init({stationId, location}) {
    console.log(`Captain init ${new Date().toISOString()}`);
    const davId = stationId;
    const walletAddress = stationId;
    const sdk = new DavSDK(davId, walletAddress, mnemonic);
    this.station = {
      sdk: sdk,
      location: location,
      needs: [],
      bids: []
    }

    this.station.sdk.initCaptain({
      id: davId,
      model: 'GRADD',
      icon: `https://lorempixel.com/100/100/abstract/?${davId}`,
      coords: {
        long: this.station.location.longitude,
        lat: this.station.location.latitude
      },
      missions_completed: 0,
      missions_completed_7_days: 0,
      status: 'available'
    });
    let isRegistered = await this.station.sdk.isRegistered();
  
    if (isRegistered) {
      let missionContract = this.station.sdk.mission().contract();
      missionContract.subscribe(
        mission => this.onContractCreated(this.station, mission),
        err => console.log(err),
        () => console.log('')
      );
    } else {
      const tokenContract = await sdk.davContracts.getInstance('identity');
      throw `Captain ${davId} is not registered to ${JSON.stringify(tokenContract.address)}`;
    }

    const droneDelivery = this.station.sdk.needs().forType('route_plan', {
      ...this.station.location,
<<<<<<< HEAD
      radius: 4000000,
=======
      radius: 4000,
>>>>>>> master
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
        let mission = await this.station.sdk.getMission(missionId);
        let vehicle = await this.station.sdk.getCaptain(mission.captain_id);
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
              case 'confirmed':
                break;
              case 'completed':
                await this.updateStatus(state.mission, 'completed', 'available');
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

  async onInProgress(mission, captain) {
    await this.station.sdk.updateMission(mission.mission_id, {
      status: 'in_mission',
      captain_id: captain.id
    });

    await this.onInMission(mission, captain);
  }

  async onInMission(mission, captain) {

    switch (captain.status) {
      case 'contract_received':
        this.updateStatus(mission, 'in_progress', 'in_progress');
        break;
      case 'in_progress':
        graddMailService.emailGraddStatusPayloadRequest(mission);
        break;
      case 'ready':
        break;
      case 'available':
        await this.station.sdk.updateMission(mission.mission_id, {
          status: 'completed',
          captain_id: captain.id
        });
        break;
      default:
        console.log(`bad captain.status ${captain}`);
        break;
    }
  }

  async updateStatus(mission, missionStatus, vehicleStatus) {
    await this.station.sdk.updateMission(mission.mission_id, {
      mission_status: missionStatus,
      vehicle_status: vehicleStatus,
      captain_id: mission.captain_id
    });
  }

  async onNeed(station, need) {
    if (station.needs.includes(need.id)) {
      return;
    }

    const bidInfo = {
      price: '150000000000000000000',
      price_type: 'flat',
      price_description: 'Flat fee',
      captain_id: station.sdk.davId,
      ETA: 72,
      // time_to_pickup: (distToPickup / DRONE_AVG_VELOCITY) + 1,
      // time_to_dropoff: (distToDropoff / DRONE_AVG_VELOCITY) + 1,
      // drone_manufacturer: 'Copter Express',
      // drone_model: 'SITL',
      ttl: 259200 // TTL in seconds
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
    this.beginMission(mission.captain_id, mission.mission_id);
  }
}

module.exports = Gradd;
