package kr.or.oti.mafiagame.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.or.oti.mafiagame.domain.RoomSummary;

@Mapper
public interface RoomMapper {
    List<RoomSummary> findAll();
}
