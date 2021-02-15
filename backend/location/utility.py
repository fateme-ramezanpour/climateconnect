from rest_framework.exceptions import ValidationError
from location.models import Location
from django.contrib.gis.geos import (
    MultiPolygon, Polygon, GEOSGeometry, LinearRing, Point
)
import json
import requests
from django.db.models import Q
from django.contrib.gis.measure import D
from django.conf import settings

def get_legacy_location(location_object):
    required_params = ['city', 'country']

    for param in required_params:
        if param not in location_object:
            raise ValidationError('Required parameter is missing:'+param)
    
    loc = Location.objects.filter(
        city=location_object['city'], 
        country=location_object['country']
    )
    if loc.exists():
        return loc[0] 
    else:
        loc = Location.objects.create(
            city=location_object['city'],
            country=location_object['country'],
            name= location_object['city'] + ", " + location_object['country']
        )
        return loc
    


def get_location(location_object):
    if settings.ENABLE_LEGACY_LOCATION_FORMAT == "True":
        return get_legacy_location(location_object)

    required_params = [
        'osm_id', 
        'place_id', 
        'city',
        'state',
        'country',
        'name',
        'type'
    ]
    for param in required_params:
        if param not in location_object:
            raise ValidationError('Required parameter is missing:'+param)
    loc = Location.objects.filter(place_id=location_object['place_id'])
    if loc.exists():
        return loc[0]
    elif location_object['type'] == "Point":
        point = GEOSGeometry(str(location_object['geojson']))
        coords = list(point)
        switched_point = Point(coords[1], coords[0])
        loc = Location.objects.create(
            osm_id=location_object['osm_id'],
            place_id=location_object['place_id'],
            city=location_object['city'],
            state=location_object['state'],
            country=location_object['country'],
            name=location_object['name'],
            centre_point=switched_point,
        )
        return loc
    else:
        multipolygon = get_multipolygon_from_geojson(location_object['geojson'])
        loc = Location.objects.create(
            osm_id=location_object['osm_id'],
            place_id=location_object['place_id'],
            city=location_object['city'],
            state=location_object['state'],
            country=location_object['country'],
            name=location_object['name'],
            multi_polygon=multipolygon,
        )
        return loc


def get_multipolygon_from_geojson(geojson):
    input_polygon =  GEOSGeometry(str(geojson))
    
    if isinstance(input_polygon,Polygon):
        return MultiPolygon(
            get_polygon_with_switched_coordinates(input_polygon)
        )
    elif isinstance(input_polygon, MultiPolygon):
        polygons = list(input_polygon)
        switched_multipolygon = []
        for polygon in polygons:
            switched_polygon = get_polygon_with_switched_coordinates(polygon)
            switched_multipolygon.append(switched_polygon)        
        return MultiPolygon(switched_multipolygon)
    else:
        raise Exception("PolygonInstanceNotFound: Wrong input")


def get_polygon_with_switched_coordinates(polygon):
    switched_poly = []
    linear_rings = list(polygon)
    for ring in linear_rings:
        switched_ring = []
        points = list(ring)
        for point in points:
            switched_point = (point[1], point[0])
            switched_ring.append(switched_point)
        switched_poly.append(LinearRing(switched_ring))

    return Polygon(*switched_poly)


# Commenter: Chris
# The code for formatting a location is the same code as in the frontend pythonized.
# The reason why we have it here as well is to format locations that we retrieved
# with direct requests from the backend to nominatim.
# This means changes made here or in the equivelant function in the frontend also need to 
# be applied to the other function so they stay consistent
# This whole setup is less than ideal and should be changed in the future.

def format_location(location_string, already_loaded):
    if already_loaded:
        location_object = location_string
    else:
        location_object = json.loads(location_string)[0]
    location_name = format_location_name(location_object)
    return {
        'type': location_object['geojson']['type'],
        'place_id': location_object['place_id'],
        'osm_id': location_object['osm_id'],
        'name': location_name['name'],
        'city': location_name['city'],
        'state': location_name['state'],
        'country': location_name['country'],
        'geojson': location_object['geojson'],
        'coordinates': location_object['geojson']['coordinates']
    }

def format_location_name(location):
    first_part_order = [
        "village",
        "town",
        "city_district",
        "district",
        "suburb",
        "borough",
        "subdivision",
        "neighbourhood",
        "place",
        "city",
        "municipality",
        "county",
        "state_district",
        "province",
        "state",
        "region"
    ]
    middle_part_order = [
        "city_district",
        "district",
        "suburb",
        "borough",
        "subdivision",
        "neighbourhood",
        "town",
        "village"
    ]
    if is_country(location):
        return {
            'country': location['address']['country'],
            'city': "",
            'state': "",
            'name': location['display_name']
        }
    
    middle_part_suffixes = ["city", "state"]
    first_part = get_first_part(location['address'], first_part_order)
    middle_part = get_middle_part(location['address'], middle_part_order, middle_part_suffixes)
    return {
        'city': first_part,
        'state': middle_part,
        'country': location['address']['country'],
        'name': first_part + ", " + middle_part + (", " if len(middle_part) > 0 else "") + location['address']['country'],
    }

def is_country(location):
    if location['type'] != "administrative":
        return False
    # short circuit if the address contains any information other than country and country code
    for key in location['address'].keys():
        if key not in ["country", "country_code"]:
            return False       
    return True

def get_first_part(address, order):
    for loc_type_descriptor in order:
        if loc_type_descriptor in address.keys():
            if loc_type_descriptor == "state":
                return address[loc_type_descriptor] + " (state)"
            return address[loc_type_descriptor]       
    return ""

def get_middle_part(address, order, suffixes):
    for loc_type_descriptor in order:
        if loc_type_descriptor in address.keys():
            for suffix in suffixes:
                if suffix in address.keys():
                    return address[suffix]
    return ""

def get_location_ids_in_range(query_params): 
    filter_place_id = query_params.get('place')
    locations = Location.objects.filter(place_id=filter_place_id)
        # shrink polygon by 1 meter to exclude places that share a border
    # Example: Don't show projects from the USA when searching for Mexico
    distance = -1 # distance in meter
    buffer_width = distance / 40000000.0 * 360.0            
    if not locations.exists():
        url_root = settings.LOCATION_SERVICE_BASE_URL + "/lookup?osm_ids="
        # Append osm_id to first letter of osm_type as uppercase letter 
        osm_id_param = query_params.get('loc_type')[0].upper()+query_params.get('osm')
        params = "&format=json&addressdetails=1&polygon_geojson=1&accept-language=en-US,en;q=0.9"
        url = url_root+osm_id_param+params
        response = requests.get(url)
        location = get_location(format_location(response.text, False))
        location_in_db = location.multi_polygon.buffer(buffer_width)
    else:        
        location_in_db = locations[0].multi_polygon.buffer(buffer_width)
    radius = 0
    if 'radius' in query_params:
        radius_value = query_params.get('radius')
        radius = D(km=radius_value) 
    locations_in_range = Location.objects.filter(
        Q(multi_polygon__distance_lte=(location_in_db, radius))
        |
        Q(centre_point__distance_lte=(location_in_db, radius))
    )
    return list(map((lambda loc: loc.id), locations_in_range))